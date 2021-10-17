
import { useState, useEffect } from 'react';
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Head from 'next/head'
import Post from './helps/Post'
import { sortByDate } from './utils'


export default function HelpBlog({ posts }) {
  console.log('12 HelpBlog posts', posts);
    const [mappedPosts, setMappedPosts] = useState([]);

    useEffect(() => {
      console.log('16 HelpBlog mappedPosts', mappedPosts);
      
      if (posts?.length) {
        setMappedPosts(
        //   posts.map(p => {
        //     return {
        //       ...p,
              
        //     }
        //   })
          posts.map((post, index) => (
            <Post key={index} post={post} />
          ))
        );
      } else {
        setMappedPosts([]);
      }

      console.log('36', posts, mappedPosts);
    }, [posts]);
//   const page = (props: any) => {
    console.log('39', posts, mappedPosts);
    // const { posts } = props;
    
    
    return (
      <div>
        {/* <Head>
          <title>Dev Blog</title>
        </Head> */}
  
        <div className='posts'>aaaaa
          {/* {posts?.map((post, index) => (
            <Post key={index} post={post} />
          ))}
          bbb */}
            {mappedPosts.length ? mappedPosts
            : <p>No posts yet</p>}
        </div>
      </div>
    )
  }
  
  export const getServerSideProps = async pageContext => {
    // Get files from the posts dir
    const files = fs.readdirSync(path.join('src/posts'))
    // Get slug and frontmatter from posts
    console.log('61', files);
    
    const posts = files.map((filename) => {
      // Create slug
      const slug = filename.replace('.md', '')
      console.log('32', files,  slug);  
      // Get frontmatter
      const markdownWithMeta = fs.readFileSync(
        path.join('src/posts', filename),
        'utf-8'
      )
      console.log('38', matter(markdownWithMeta));
      const { data: frontmatter } = matter(markdownWithMeta)
      console.log('41', frontmatter, slug);
      return {
        slug,
        frontmatter,
      }
    })

    console.log('49', posts.sort(sortByDate));
    
    return {
      props: {
        posts: posts.sort(sortByDate),
      },
    }
  }



// export const getServerSideProps = async pageContext => {
//   const query = encodeURIComponent('*[ _type == "post" ]');
//   const url = `https://x7wbre1b.api.sanity.io/v1/data/query/production?query=${query}`;
//   const result = await fetch(url).then(res => res.json());
//   console.log('48', url, result);   
//   if (!result.result || !result.result.length) {
//     return {
//       props: {
//         posts: [],
//       }
//     }
//   } else {
//     return {
//       props: {
//         posts: result.result,
//       }
//     }
//   }
// };