import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => {
    return !data.draft
  })

  const searchIndex = posts.map((post) => {
    // Extract plain text from markdown content
    const body = post.body || ''
    const content = body
      .replace(/^---[\s\S]*?---/, '') // Remove frontmatter
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
      .replace(/\n{2,}/g, '\n') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 500)

    // Generate slug from id if not available
    const slug = post.id.replace(/\.mdx?$/, '')

    return {
      id: post.id,
      slug,
      title: post.data.title,
      description: post.data.description || '',
      content,
      categories: post.data.categories || [],
      pubDate: post.data.pubDate.toISOString(),
      url: `/posts/${slug}`
    }
  })

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}