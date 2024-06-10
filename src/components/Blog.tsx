// const router = useRouter();
import imageUrlBuilder from '@sanity/image-url';
import { useState, useEffect } from 'react';
import Image from 'next/image'

const debug = false;

export default function Blog({ posts }: { posts: any[] }) {
  // if (debug) console.log('6 Blog posts', posts);
    
  const [mappedPosts, setMappedPosts] = useState<any[]>([]);


  return (
    <div >
      <div >
        {/* {mappedPosts.length ? mappedPosts.map((p, index) => ( */}
        {mappedPosts.length ? mappedPosts.map((p: any, index) => ( p.categories[0]._ref === '22b82a07-c7fc-4987-8167-1b1bd845a585' ) && (
        // {mappedPosts.length ? mappedPosts.map((p, index) => ( p.categories[0]._key === '94cd5e248bf3' ) && (
          // <div onClick={() => router.push(`/post/${p.slug.current}`)} key={index} className={styles.post}>
          <div key={index}>
            <h3>{p.title}</h3>
            {/* <h3>{p.categories[0].category.title}</h3> */}
            <Image src={p.mainImage} alt="" />
          </div>
        )) : <>No Posts Yet</>}
      </div>
    </div>
  )
}

export const getServerSideProps = async (pageContext: any) => {
  const query = encodeURIComponent('*[ _type == "post" ]');
  const url = `https://x7wbre1b.api.sanity.io/v1/data/query/production?query=${query}`;
  const result = await fetch(url).then(res => res.json());
  if (debug) console.log('48', url, result);   
  if (!result.result || !result.result.length) {
    return {
      props: {
        posts: [],
      }
    }
  } else {
    return {
      props: {
        posts: result.result,
      }
    }
  }
};