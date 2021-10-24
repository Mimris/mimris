export const sortByTitle = (a, b) => {
    return new Date(b.frontmatter.title) - new Date(a.frontmatter.title)
  }