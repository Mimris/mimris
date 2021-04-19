// const router = useRouter();
import imageUrlBuilder from '@sanity/image-url';
import { useState, useEffect } from 'react';

export default function Blog({ posts }) {
  console.log('6 Blog posts', posts);
    
  const [mappedPosts, setMappedPosts] = useState([]);
  useEffect(() => {
    if (posts?.length) {
      const imgBuilder = imageUrlBuilder({
        projectId: 'x7wbre1b',
        dataset: 'production',
      });
      setMappedPosts(
        posts.map(p => {
          return {
            ...p,
            mainImage: imgBuilder.image(p.mainImage).width(500).height(250),
          }
        })
      );
    } else {
      setMappedPosts([]);
    }
  }, [posts]);


  return (
    <div >
      <div >
        {/* {mappedPosts.length ? mappedPosts.map((p, index) => ( */}
        {mappedPosts.length ? mappedPosts.map((p, index) => ( p.categories[0]._ref === '22b82a07-c7fc-4987-8167-1b1bd845a585' ) && (
        // {mappedPosts.length ? mappedPosts.map((p, index) => ( p.categories[0]._key === '94cd5e248bf3' ) && (
          // <div onClick={() => router.push(`/post/${p.slug.current}`)} key={index} className={styles.post}>
          <div>
            <h3>{p.title}</h3>
            {/* <h3>{p.categories[0].category.title}</h3> */}
            <img src={p.mainImage} />
          </div>
        )) : <>No Posts Yet</>}
      </div>
    </div>
  )
}

export const getServerSideProps = async pageContext => {
  const query = encodeURIComponent('*[ _type == "post" ]');
  const url = `https://x7wbre1b.api.sanity.io/v1/data/query/production?query=${query}`;
  const result = await fetch(url).then(res => res.json());
  console.log('48', url, result);   
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