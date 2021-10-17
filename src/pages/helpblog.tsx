import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Head from 'next/head'
import Header from '../components/Header'
import Post from '../components/helps/Post'
import { sortByDate } from '../components/utils'


export default function Home({ posts }) {
  console.log('12 ', posts);
  
  return (
    <div>
      <main className="container">
        <div>
          <h1>Help Blog</h1>
        </div>
        <Header />
        <div className='posts'>
          {posts.map((post, index) => (
            (post) && <Post key={index} post={post} />
          ))}
        </div>
      </main>
    </div>
  )
}

export async function getStaticProps() {
  // Get files from the posts dir
  const files = fs.readdirSync(path.join('src/posts'))

  // Get slug and frontmatter from posts
  const posts = files.map((filename) => {
    // Create slug
    const slug = filename.replace('.md', '')

    // Get frontmatter
    const markdownWithMeta = fs.readFileSync(
      path.join('src/posts', filename),
      'utf-8'
    )

    const { data: frontmatter } = matter(markdownWithMeta)
    const resultat = {
      slug,
      frontmatter,
    }
    return resultat
  })

  return {
    props: {
      posts: posts.sort(sortByDate),
    },
  }
}