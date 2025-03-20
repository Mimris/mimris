import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

import Link from 'next/link'

import Layout from '../../components/Layout'



export default function PostPage({
  frontmatter: { title, date, cover_image },
  slug,
  content,
}) {
  // console.log('12 slug', slug, content)

  return (
    <>
      {/* <Layout ></Layout> */}
      {/* <Layout> */}
      <div className="container">
        <Link href='/helpblog/'>Go Back</Link>
        <div className='card card-page' >
          <h1 className='post-title'>{title}</h1>
          <img src={cover_image} alt='' max-width="200px" />
          <div className='post-body'>
            <div dangerouslySetInnerHTML={{ __html: marked(content) }}></div>
          </div>
          <div className='post-date'>Posted on {date}</div>
          <Link href='/helpblog/'>Go Back</Link>
        </div>
      </div>
      {/* </Layout> */}
      <style jsx>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background: #fff;
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
      max-width: 300px;
      width: 90%;
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
      padding: 10 10px;
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
      // background: #f4f4f4;
      background: #c4c4c4;
      color: #000;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    
    .posts {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 30px;
    }
    
    .card {
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    }
    
    .card-page {
      max-width: 850px;
      padding: 15px 30px;
      // background: red;
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
    
    @media (max-width: 500px) {
      .posts {
        grid-template-columns: 1fr;
      }
    }
    `}</style>

    </>
  )
}

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('src/posts'))

  const paths = files.map((filename) => ({
    params: {
      slug: filename.replace('.md', ''),
    },
  }))
  // console.log('38 paths', paths)
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params: { slug } }) {
  const markdownWithMeta = fs.readFileSync(
    path.join('src/posts', slug + '.md'),
    'utf-8'
  )
  // console.log('49' ,markdownWithMeta)
  const { data: frontmatter, content } = matter(markdownWithMeta)

  const result = {
    props: {
      frontmatter,
      slug,
      content,
    },
  }
  // console.log('60', result)
  return result
}