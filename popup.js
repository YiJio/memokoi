// actions
const changeThemeButton = document.getElementById('changeTheme');
const changeToTealButton = document.getElementById('changeToTeal');
const changeToOliveButton = document.getElementById('changeToOlive');
const changeToGrayButton = document.getElementById('changeToGray');
const openFormButton = document.getElementById('openForm');
const quickGrabButton = document.getElementById('quickGrab');
const searchInput = document.getElementById('searchInput');
// form items
const addSiteForm = document.getElementById('addForm');
const formMessage = document.getElementById('formMessage');
const formInput1 = document.getElementById('siteName');
const formInput2 = document.getElementById('siteURL');
const formInput3 = document.getElementById('siteDesc');
const formInput4 = document.getElementById('siteTags');
const addSiteButton = document.getElementById('addBtn');
const cancelAddButton = document.getElementById('cancelBtn');
// list
const siteList = document.getElementById('siteList');

// initial site list for testing
/*let sites = [
	{ name: "Google", url: "google.com", description: "Search engine", tags: [], count: 0 },
	{ name: "YouTube", url: "youtube.com", description: "Video sharing platform", tags: [], count: 0 },
	{ name: "Stack Overflow", url: "stackoverflow.com", description: "Programming Q&A site", tags: [], count: 0 }
];*/
let sites = [];

// function to apply the theme
function applyTheme(theme) {
	changeThemeButton.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
	if(theme === 'light') { document.body.classList.replace('theme--light', 'theme--dark'); }
	else { document.body.classList.replace('theme--dark', 'theme--light'); }
	chrome.storage.sync.set({ theme: theme });
}

// function to apply the color theme
function applyColor(color) {
	if(color === 'teal') {
		document.body.classList.replace('theme--gray', 'theme--teal');
		changeToTealButton.style.display = 'none';
		changeToOliveButton.style.display = 'flex';
		changeToGrayButton.style.display = 'none';
	} else if(color === 'olive') {
		document.body.classList.replace('theme--teal', 'theme--olive');
		changeToTealButton.style.display = 'none';
		changeToOliveButton.style.display = 'none';
		changeToGrayButton.style.display = 'flex';
	} else {
		document.body.classList.replace('theme--olive', 'theme--gray');
		changeToTealButton.style.display = 'flex';
		changeToOliveButton.style.display = 'none';
		changeToGrayButton.style.display = 'none';
	}
	chrome.storage.sync.set({ color: color });
}

// function to update the tab counts from chrome
function updateCounts() {
	chrome.tabs.query({}, (tabs) => {
		sites.forEach(site => {
			site.count = tabs.filter(tab => {
				try {
					//const tabUrl = new URL(tab.url);
					//const siteUrl = new URL(site.url);
					//console.log('tab',tabUrl, 'site',siteUrl);
					//return tabUrl.href.includes(siteUrl.href) || tabUrl.href === siteUrl.href;
					const url = new URL(tab.url);
					const domain = url.hostname;
					if(tab.url.includes(site.url)) {console.log('domain:',domain, ',taburl:', tab.url, ',siteurl:',site.url);}
					return tab.url.includes(site.url) || tab.url === site.url || domain.endsWith(site.url) || domain === site.url;
				} catch (error) {
					return false;
				}
			}).length;
		});
		renderList();
	});
}

// function to filter the site list
function filterList(sites, searchTerm) {
	const filteredSites = sites.filter(site => {
		const nameMatch = site.name.toLowerCase().includes(searchTerm);
		const urlMatch = site.url.toLowerCase().includes(searchTerm);
		const descriptionMatch = site.description && site.description.toLowerCase().includes(searchTerm);
		return nameMatch || urlMatch || descriptionMatch;
	});
	filteredSites.sort((a, b) => {
		const aKey = getSortKey(a.name);
		const bKey = getSortKey(b.name);
		return aKey.localeCompare(bKey);
	});
	return filteredSites;
}

// function to render individual item elements
function renderItem(site, searchTerm) {
	const item = document.createElement('li'); item.className = 'mk-list__item';
	const row = document.createElement('div'); row.className = 'mk-list__row';
	const info = document.createElement('div'); info.className = 'mk-list__info';
	const name = document.createElement('div'); name.className = 'mk-list__name';
	const link = document.createElement('a');
	link.href = `https://${site.url}`;
	link.target = '_blank';
	link.innerHTML = searchTerm ? getHighlightedText(site.name, searchTerm) : site.name;
	const icon = document.createElement('i'); icon.classList = 'fas fa-external-link';
	const count = document.createElement('span'); count.className = 'mk-list__count';
	count.innerHTML = `(tabs in pond: <b class="mk-important">${site.count}</b>)`;
	const button = document.createElement('button'); button.classList = 'mk-button mk-button--delete';
	button.innerHTML = '<i class="fas fa-trash"></i>';
	button.onclick = () => deleteSite(site.url);
	const desc = document.createElement('p'); desc.className = 'mk-list__desc';
	desc.innerHTML = searchTerm ? getHighlightedText(site.description, searchTerm) : site.description;
	const tags = document.createElement('div'); tags.className = 'mk-list__tags';
	if(site.tags && site.tags.length !== 0 && site.tags[0] !== '') {
		let tagsHtml = '';
		site.tags.forEach(tag => tagsHtml += `<div class="mk-tag">${tag}</div>`);
		tags.innerHTML = tagsHtml;
	}
	name.appendChild(link);
	name.appendChild(icon);
	info.appendChild(name);
	info.appendChild(count);
	row.appendChild(info);
	row.appendChild(button);
	item.appendChild(row);
	item.appendChild(desc);
	item.appendChild(tags);
	return item;
}

// function to render the site list
function renderList() {
	siteList.innerHTML = '';
	const searchTerm = searchInput.value.toLowerCase();
	const filteredSites = filterList(sites, searchTerm);
	const groupedSites = groupByHeader(filteredSites);
	for (const header in groupedSites) {
		const headerElement = document.createElement('h2');
		headerElement.textContent = header;
		siteList.appendChild(headerElement);
		const siteListElement = document.createElement('ul');
		siteListElement.className = 'mk-list';
		groupedSites[header].forEach(site => siteListElement.appendChild(renderItem(site, searchTerm)));
		siteList.appendChild(siteListElement);
	}
}

// function to reset the form
function resetFields(mode) {
	if (mode === 'all') {
		addSiteForm.style.display = 'none';
		openFormButton.style.display = 'block';
	}
	formInput1.className = 'mk-input';
	formInput1.value = '';
	formInput2.className = 'mk-input';
	formInput2.value = '';
	formInput3.value = '';
	formInput4.value = '';
	formMessage.style.display = 'none';
	formMessage.innerHTML = '';
}

// function to delete a site
function deleteSite(url) {
	const index = sites.findIndex(site => site.url === url);
	if (index !== -1) {
		sites.splice(index, 1);
		saveSites();
		updateCounts();
	}
}

// function to quickly add site details
async function grabCurrentSite() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		const [{ result }] = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				const title = document.title || document.querySelector('meta[name="title"]')?.content;
				const description = document.querySelector('meta[name="description"]')?.content;
				const siteName = document.querySelector('meta[property="og:site_name"]')?.content;
				return { title, description, siteName };
			}
		});
		const { title, description, siteName } = result;
		const url = tab.url;
		const parsedUrl = parseUrl(url);
		if (parsedUrl) {
			formInput1.value = siteName || title || parsedUrl.name;
			formInput2.value = parsedUrl.url;
			formInput3.value = description || '';
			addSiteForm.style.display = 'flex';
			openFormButton.style.display = 'none';
		}
	} catch (error) {
		console.error('Error grabbing site details:', error);
		alert('Could not grab this site\'s details! Please enter site details manually.');
	}
}

// onclick event to change theme
changeThemeButton.addEventListener('click', () => {
	const now = changeThemeButton.innerHTML;
	applyTheme(now.includes('sun') ? 'light' : 'dark');
});
changeToTealButton.addEventListener('click', () => {
	applyColor('teal');
});
changeToOliveButton.addEventListener('click', () => {
	applyColor('olive');
});
changeToGrayButton.addEventListener('click', () => {
	applyColor('gray');
});

// oninput event to update list on every search keystroke
searchInput.addEventListener('input', renderList);

// onclick event to grab current site
quickGrabButton.addEventListener('click', grabCurrentSite);

// onclick event for button to open form
openFormButton.addEventListener('click', () => {
	addSiteForm.style.display = 'flex';
	openFormButton.style.display = 'none';
	resetFields('inputs');
});

// onchange event when user types anything on the inputs
formInput1.addEventListener('change', () => {
	formInput1.className = 'mk-input';
});
formInput2.addEventListener('change', () => {
	formInput2.className = 'mk-input';
});

// onclick event to add the site
addSiteButton.addEventListener('click', () => {
	const name = formInput1.value.trim();
	const url = formInput2.value.trim();
	const description = formInput3.value.trim();
	const tags = formInput4.value.trim().replaceAll(' ','-').split(',-');
	if (name && url) {
		console.log(sites.some(site => site.url === url))
		if (sites.some(site => site.url === url)) {
			formMessage.style.display = 'block';
			formMessage.innerHTML = 'A site with this URL already exists.';
		} else {
			const url2 = !url.includes('http') ? `https://${url}` : url;
			const parsedUrl = parseUrl(url2);
			sites.push({ name, url: parsedUrl.url, description, tags, count: 0 });
			saveSites();
			updateCounts();
			resetFields('all');
		}
	} else {
		formMessage.style.display = 'block';
		formMessage.innerHTML = 'Please enter all required fields.';
	}
	formInput1.className += name ? '' : ' mk-input--invalid';
	formInput2.className += url ? '' : ' mk-input--invalid';
});

// onclick event to cancel form
cancelAddButton.addEventListener('click', () => {
	resetFields('all');
});

sites.forEach(site => {
	Object.defineProperty(site, 'count', {
		set: function (newCount) {
			this._count = newCount;
			saveSites();
			renderList();
		},
		get: function () {
			return this._count;
		}
	});
});

// listen for tab events - update count whenever tab events are fired
chrome.tabs.onCreated.addListener(updateCounts);
chrome.tabs.onRemoved.addListener(updateCounts);
// initial count for sessions, startup, restoring, and first installed
chrome.runtime.onStartup.addListener(updateCounts);
chrome.runtime.onInstalled.addListener(updateCounts);
// persisting data between sessions
chrome.storage.sync.get(['sites'], function (result) {
	if (result.sites) { sites = result.sites; }
	updateCounts();
});
// function to save sites to chrome storage
function saveSites() {
	chrome.storage.sync.set({ sites: sites }, function () {
		console.log('Sites saved!');
		console.log(sites)
	});
}
// load saved theme on popup load
chrome.storage.sync.get(['theme'], function (result) {
	const savedTheme = result.theme || 'light';
	applyTheme(savedTheme);
});
chrome.storage.sync.get(['color'], function (result) {
	const savedColor = result.color || 'teal';
	applyColor(savedColor);
});