  
  
    export const fetchProjectFile = async (org, repo) => {
        const projectfileUrl = `https://api.github.com/repos/${org}/${repo}/contents/${path}/${file}?ref=${branch}`
        try {
            if (debug) console.log('89 issues fetch', file)
            const res = await fetch(projectFileUrl);
            const data = await res.json();
            if (debug) console.log('54 issues', res, data)
            if (data.length === 0) { // if there is an error
                console.error('Error fetching issues:', data.message);
                setProjectFile([]);
            } else {
                setProjectFile(data);
            }
            if (debug) console.log('58 issues', data)
            if (debug) console.log('59 issues', issues)

            if (issues.length > 0) {
                issues.map(async (issue) => {
                const res = await fetch(issue.comments_url);
                const data = await res.json();
                if (debug) console.log('67 comments', res, data)
                if (data.length === 0) { // if there is an error
                    console.error('Error fetching comments:', data.message);
                    setComments([]);
                } else {
                    setComments((comments) => [...comments, data]);
                }
                if (debug) console.log('71 comments', data)
                })
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
        if (debug) console.log('72 comments', issues)
    }