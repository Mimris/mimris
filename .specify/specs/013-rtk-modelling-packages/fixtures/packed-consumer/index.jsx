import dynamic from 'next/dynamic'; const Test = dynamic(() => import('../TestScreen'), {ssr:false}); export default Test;
