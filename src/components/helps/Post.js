import Link from 'next/link'
import Layout from '../Layout'


export default function Post({ post }) {
  const frontmatter = post?.frontmatter || {}
  const title = typeof frontmatter.title === 'string' ? frontmatter.title : post?.slug || 'Untitled post'
  const date = typeof frontmatter.date === 'string' ? frontmatter.date : ''
  const excerpt = typeof frontmatter.excerpt === 'string' ? frontmatter.excerpt : ''
  const coverImage = typeof frontmatter.cover_image === 'string' ? frontmatter.cover_image : ''
  const isOsduPost = title.startsWith('OSDU ')

  return (
    <>
      <div className="py-0 mx-auto">{isOsduPost ? 'OSDU Usecase' : 'Mimris doc'} </div>
      <div className={`card d-flex justify-content-between ${isOsduPost ? 'green-border' : ''}`} style={{ height: '100%' }}>
        <div>
          <Link className="img" href={`/helpblog/${post.slug}`} target="AKMM Help">
            {coverImage ? <img className="mb-1" src={coverImage} alt={title} /> : null}
          </Link>
          <div className='post-date'>{date ? `Posted on ${date}` : 'No date'}</div>
          <h5>{title}</h5>
          <p className="excerpt">{excerpt}</p>
        </div>
        <Link href={`/helpblog/${post.slug}#AKMM Help`} className='btn' >Read More</Link>
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
        font-size: 90%;
        margin: 15px 0;
        line-height: 1.8;
      }
      
      a {
        text-decoration: none;
        color: #333;
      }
      
      img {
        width: 90%;
        min-height: 140px;
        max-height: 140px;
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
        background: #333;
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
        gap: 20px;
        margin-top: 10px;
      }
      
      .card {
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        min-height: auto;
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


      .green-border {
        border: 8px solid green;
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
