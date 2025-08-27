---
title: 简单Python脚本
pubDate: 2025-02-18
categories: ["技术","python"]
description: "简单的Python爬虫脚本"
slug: python-craw
---


## 豆瓣读书排行榜

```python
import requests # HTTP请求库
from bs4 import BeautifulSoup  # HTML解析库
import pandas as pd #数据存储
import time
from fake_useragent import UserAgent


def get_douban_books(pages=10):
    books_data = []
    #反爬虫处理，随机生成User-Agent
    ua = UserAgent()

    headers = {
        'User-Agent': ua.random, # 每次请求使用不同的User-Agent
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8',
        'Connection': 'keep-alive'
    }

    for page in range(pages):
        url = f'https://book.douban.com/top250?start={page * 25}'

        try:
            # 发送请求
            response = requests.get(url, headers=headers)
            response.raise_for_status() #检查请求状态，如果不是200会抛出异常
            # 解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            books = soup.select('tr.item') # CSS选择器，选择class为item的tr标签

            for book in books:
                try:
                    title = book.select_one('div.pl2 a').get('title')# select_one()返回第一个匹配的元素
                    info = book.select_one('p.pl').text.strip()  # 获取a标签的title属性
                    rating = book.select_one('span.rating_nums').text.strip()# 获取文本内容并去除首尾空白

                    # 评价人数处理
                    rating_people = book.select_one('span.pl').text
                    # 清理字符串，只保留数字，使用filter()函数过滤字符串，只保留数字
                    # str.isdigit() 判断字符是否为数字
                    # filter() 过滤函数，第一个参数是判断条件，第二个参数是可迭代对象
                    # ''.join() 将字符列表连接成字符串
                    rating_people = ''.join(filter(str.isdigit, rating_people))
                    # 条件判断处理可能不存在的元素
                    quote = book.select_one('span.inq')
                    quote = quote.text if quote else ''# 如果元素存在则获取文本，否则返回空字符串

                    # 使用字典存储每本书的信息
                    books_data.append({
                        '书名': title,
                        '基本信息': info,
                        '评分': float(rating),  # 字符串转float
                        '评价人数': int(rating_people),# 字符串转int
                        '一句话评价': quote
                    })

                except Exception as e:
                    print(f'解析单本书籍信息出错: {e}')
                    continue
            # 添加延时，避免请求过快
            time.sleep(2)

        except Exception as e:
            print(f'爬取第{page + 1}页时出错: {e}')
            continue

        print(f'成功爬取第{page + 1}页')

    return books_data


def save_to_excel(books_data, filename='douban_books.xlsx'):
    # 将字典列表转换为DataFrame
    df = pd.DataFrame(books_data)
    # 保存为Excel文件
    df.to_excel(filename, index=False, engine='openpyxl')
    print(f'数据已保存到 {filename}')


if __name__ == '__main__':
    print('开始爬取豆瓣图书排行榜...')
    books_data = get_douban_books(pages=10)
    save_to_excel(books_data)
```



## 豆瓣电影top

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from fake_useragent import UserAgent


def clean_text(text):
    """清理文本数据，移除多余的空格和换行符"""
    if text:
        return ' '.join(text.strip().split())
    return ''


def get_douban_movies(pages=10):
    movies_data = []
    ua = UserAgent()

    headers = {
        'User-Agent': ua.random,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/web  p,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8',
        'Connection': 'keep-alive'
    }

    for page in range(pages):
        url = f'https://movie.douban.com/top250?start={page * 25}'

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            movies = soup.select('div.item')

            for movie in movies:
                try:
                    # 获取标题
                    title = movie.select_one('.title').text.strip() if movie.select_one('.title') else '未知'

                    # 获取外文名（如果存在）
                    foreign_title = movie.select_one('.other')
                    foreign_name = clean_text(foreign_title.text) if foreign_title else ''

                    # 获取详细信息
                    info_element = movie.select_one('div.bd p')
                    if info_element:
                        info_text = clean_text(info_element.text)
                        # 分割信息
                        info_parts = info_text.split('/')

                        # 提取导演和演员信息（通常在第一部分）
                        director_actor = info_parts[0] if info_parts else ''

                        # 提取年份、地区、类型（通常在后面几部分）
                        year_region_type = ' / '.join(info_parts[1:]) if len(info_parts) > 1 else ''
                    else:
                        director_actor = ''
                        year_region_type = ''

                    # 获取评分
                    rating = movie.select_one('.rating_num')
                    rating = float(rating.text.strip()) if rating else 0.0

                    # 获取评价人数
                    rating_people = movie.select_one('.star span:last-child')
                    if rating_people:
                        rating_people = ''.join(filter(str.isdigit, rating_people.text))
                        rating_people = int(rating_people) if rating_people else 0
                    else:
                        rating_people = 0

                    # 获取一句话评价
                    quote = movie.select_one('.quote .inq')
                    quote = quote.text.strip() if quote else ''

                    movies_data.append({
                        '中文名': title,
                        '外文名': foreign_name,
                        '导演演员': director_actor,
                        '年份地区类型': year_region_type,
                        '评分': rating,
                        '评价人数': rating_people,
                        '一句话评价': quote
                    })

                except Exception as e:
                    print(f'解析单部电影信息出错: {e}')
                    continue

            print(f'成功爬取第{page + 1}页')
            time.sleep(2)

        except Exception as e:
            print(f'爬取第{page + 1}页时出错: {e}')
            continue

    return movies_data


def save_to_excel(movies_data, filename='douban_movies.xlsx'):
    df = pd.DataFrame(movies_data)
    df.to_excel(filename, index=False, engine='openpyxl')
    print(f'数据已保存到 {filename}')


def main():
    print('开始爬取豆瓣电影Top250...')
    movies_data = get_douban_movies(pages=10)

    if movies_data:
        # 按评分排序
        sorted_movies = sorted(movies_data, key=lambda x: x['评分'], reverse=True)
        save_to_excel(sorted_movies, 'douban_movies_top250.xlsx')
    else:
        print('未获取到数据')


if __name__ == '__main__':
    main()
```