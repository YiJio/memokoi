// get sorting key (numbers first, letters last)
function getSortKey(name) {
	const match = name.match(/^(\d+)|([a-zA-Z])/); // Mmtch digits or first letter
	if (match) { return match[1] || match[2]; }
	return '';
}

// group sites by header character
function groupByHeader(sites) {
	const grouped = {};
	sites.forEach(site => {
		const header = getHeader(site.name);
		if (!grouped[header]) { grouped[header] = []; }
		grouped[header].push(site);
	});
	return grouped;
}

// get the header character (numbers first, then letters)
function getHeader(name) {
  const match = name.match(/^(\d+)|([a-zA-Z])/);
  if (match) {
    return match[1] || match[2].toUpperCase();
  }
  return '';
}

// parse the URL and extract the desired portion
function parseUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const hostname = parsed.hostname;
    // extract portion
    const pathParts = pathname.split('/');
    /*let customPath = '';
    if (pathParts.length > 1) {
      customPath = `/${pathParts.slice(1, 4).join('/')}`;
    }*/
    const siteName = hostname;
    const siteUrl = hostname + pathname;
    return { name: siteName, url: siteUrl };
  } catch (error) {
    return null;
  }
}

// get the highlighted portion
function getHighlightedText(text, highlight) {
	const regex = new RegExp(`(${highlight})`, 'gi');
	const parts = text.split(regex).map((part, index) => part.toLowerCase() === highlight.toLowerCase() ? `<span class='mk-highlight'>${part}</span>` : part);
	return parts.join('');
}