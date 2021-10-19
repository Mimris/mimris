import Link from 'next/link'


export default function Post({ post }) {
  // console.log('4 Post', post)
  return (
    <>
    <div className='card'>
      <img src={post.frontmatter.cover_image} alt='' />

      <div className='post-date'>Posted on {post.frontmatter.date}</div>

      <h3>{post.frontmatter.title}</h3>

      <p>{post.frontmatter.excerpt}</p>

      <Link href={`/helpblog/${post.slug}`} >
        <a className='btn'>Read More</a>
      </Link>
    </div>
    <style jsx>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: #fff;
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
      max-width: 768px;
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
      background: #f4f4f4;
      color: #000;
      margin-bottom: 20px;
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
    
    @media (max-width: 500px) {
      .posts {
        grid-template-columns: 1fr;
      }
    }
    `}</style>

  </>
  )
}