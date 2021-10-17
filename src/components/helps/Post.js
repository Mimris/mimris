import Link from 'next/link'
import { connect, useSelector, useDispatch } from 'react-redux';
import Page from '../page';

const page = (props) => {
// export default function Post({ post }) {
  console.log('4', post)
  return (
    <div className='card'>
      <img src={post.frontmatter.cover_image} alt='' />

      <div className='post-date'>Posted on {post.frontmatter.date}</div>

      <h3>{post.frontmatter.title}</h3>

      <p>{post.frontmatter.excerpt}</p>

      <Link href={`api/helpblog/${post.slug}`}>
        <a className='btn'>Read More</a>
      </Link>
    </div>
  )
}

export default Page(connect(state => state)(page));