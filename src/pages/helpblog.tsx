import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import Layout from '../components/Layout'
import Head from 'next/head'
import Header from '../components/Header'
import Post from '../components/helps/Post'
import { sortByTitle } from '../components/utils/sortbytitle'


export default function Home( { posts }: { posts: any[] }) {
  // console.log('12 ', posts);
  
  return (
    <>
      <Layout  >
        <div>
          <main className="container">
            <div className="pt-1" style={{backgroundColor: "#b0cfcf"}}></div>
            <div>
              <h1>AKM Modeller Help & Documentation</h1>
            </div>
            {/* <Header /> */}
            <div className='posts'>
              {posts.map((post, index) => (
                (post) && 
                <div key={index} className='card'>
                  <Post key={index} post={post} />
                </div>
              ))}
            </div>
          </main>
        </div>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400&display=swap');
      
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Poppins', sans-serif;
          }
          
          p {
            margin: 15px 0;
            line-height: 1.8;
          }
          
          a {
            text-decoration: none;
            color: #333;
          }
          
          img {
            width: 100%;
            border-radius: 10px;
          }
          
          header {
            background: steelblue;
            color: #fff;
            padding: 5px;
            margin-bottom: 40px;
          }
          
          header a {
            color: #fff;
          }
          
          .container {
            // max-width: 768px;
            margin: auto;
            overflow: auto;
            padding: 0 10px;
          }
          
          .btn {
            display: inline-block;
            background: steelblue;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            font-size: 15px;
            font-family: inherit;
          }
          
          .btn:focus {
            outline: none;
          }
          
          .btn:hover {
            transform: scale(0.98);
          }
          
          .btn-back {
            background: #f4f4f4;
            color: #000;
            margin-bottom: 20px;
          }
          
          .posts {
            display: grid;
            grid-template-columns: repeat(4, 2fr);
            gap: 20px;
            margin-top: 20px;
          }
          
          .card {
            // padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
          }
          
          .card-page {
            padding: 15px 30px;
          }
          
          .post-title {
            margin: 10px 0;
          }
          
          .post-date {
            font-size: 70%;
            background: #f4f4f4;
            margin-bottom: 20px;
            padding: 3px 10px;
          }
          
          .post-body ul,
          ol {
            font-size: 110%;
            line-height: 2.3;
            font-weight: bold;
            margin: 10px 0;
          }
          
          .post-body pre {
            background: #f4f4f4;
            padding: 20px;
            margin: 20px 0;
            line-height: 2.3;
          }
          
          @media (max-width: 1100px) {
            .posts {
              grid-template-columns: 1fr 1fr 1fr;
            }
          }
          
          @media (max-width: 900px) {
            .posts {
              grid-template-columns:  1fr 1fr;
            }
          }

          @media (max-width: 600px) {
            .posts {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </>
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
    const result = {
      slug,
      frontmatter,
    }
    return result
  })

  return {
    props: {
      posts: posts.sort(sortByTitle),
    },
  }
}