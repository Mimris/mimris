const page = (Page) => {
  return (
    class PageWrapper extends React.Component {
      render(props) {
        return (
          <Page />
        )
      }
    }
  )
}
export default page;


