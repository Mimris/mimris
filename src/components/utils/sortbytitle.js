// Add a simple try/catch to prevent errors
export const sortByTitle = (a, b) => {
  try {
    if (!a?.frontmatter?.title || !b?.frontmatter?.title) {
      return 0;
    }
    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  } catch (error) {
    console.error('Error in sortByTitle:', error);
    return 0;
  }
};