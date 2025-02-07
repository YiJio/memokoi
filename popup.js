// actions
const changeThemeButton = document.getElementById('changeTheme');
const changeToTealButton = document.getElementById('changeToTeal');
const changeToOliveButton = document.getElementById('changeToOlive');
const changeToSalmonButton = document.getElementById('changeToSalmon');
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
let tags = [];

// function to apply the theme
function applyTheme(theme) {
	document.body.classList.remove('theme--light', 'theme--dark');
	changeThemeButton.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
	if(theme === 'light') { document.body.classList.add('theme--dark'); }
	else { document.body.classList.add('theme--light'); }
	chrome.storage.sync.set({ theme: theme });
}

// function to apply the color theme
function applyColor(color) {
	document.body.classList.remove('theme--teal', 'theme--olive', 'theme--salmon', 'theme--gray');
	if(color === 'teal') {
		document.body.classList.add('theme--teal');
		changeToTealButton.style.display = 'none';
		changeToOliveButton.style.display = 'flex';
	} else if(color === 'olive') {
		document.body.classList.add('theme--olive');
		changeToOliveButton.style.display = 'none';
		changeToSalmonButton.style.display = 'flex';
	} else if(color === 'salmon') {
		document.body.classList.add('theme--salmon');
		changeToSalmonButton.style.display = 'none';
		changeToGrayButton.style.display = 'flex';
	} else {
		document.body.classList.add('theme--gray');
		changeToGrayButton.style.display = 'none';
		changeToTealButton.style.display = 'flex';
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
		const tagsMatch = site.tags?.findIndex(tag => tag.toLowerCase().includes(searchTerm));
		return nameMatch || urlMatch || descriptionMatch || (tagsMatch !== -1);
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
	const actions = document.createElement('div'); actions.className = 'mk-list__actions';
	const name = document.createElement('div'); name.className = 'mk-list__name';
	const link = document.createElement('a');
	link.href = `https://${site.url}`;
	link.target = '_blank';
	link.innerHTML = searchTerm ? getHighlightedText(site.name, searchTerm) : site.name;
	const icon = document.createElement('i'); icon.classList = 'fas fa-external-link';
	const count = document.createElement('span'); count.className = 'mk-list__count';
	count.innerHTML = `(tabs in pond: <b class="mk-important">${site.count}</b>)`;
	const editButton = document.createElement('button'); editButton.classList = 'mk-button mk-button--edit';
	editButton.innerHTML = '<i class="fas fa-pen"></i>';
	editButton.onclick = () => renderEditSite(item, site);
	const delButton = document.createElement('button'); delButton.classList = 'mk-button mk-button--delete';
	delButton.innerHTML = '<i class="fas fa-trash"></i>';
	delButton.onclick = () => deleteSite(site.url);
	const desc = document.createElement('p'); desc.className = 'mk-list__desc';
	desc.innerHTML = searchTerm ? getHighlightedText(site.description, searchTerm) : site.description;
	const tags = document.createElement('div'); tags.className = 'mk-list__tags';
	if(site.tags && site.tags.length !== 0 && site.tags[0] !== '') {
		let tagsHtml = '';
		site.tags.forEach(tag => tagsHtml += `<div class="mk-tag">${getHighlightedText(tag, searchTerm)}</div>`);
		tags.innerHTML = tagsHtml;
	}
	name.appendChild(link);
	name.appendChild(icon);
	info.appendChild(name);
	info.appendChild(count);
	actions.appendChild(editButton);
	actions.appendChild(delButton);
	row.appendChild(info);
	row.appendChild(actions);
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
	const maxLinks = 100;
	const percentage = Math.min(sites.length / maxLinks * 100, 100);
	const status = document.querySelector('.mk-status');
	const statusProgress = document.querySelector('.mk-status__progress');
	const statusCount = document.querySelector('.mk-status__count');
	statusProgress.style.width = percentage + '%';
	statusCount.innerHTML = `koi memory: ${sites.length} sites`;
	if(sites.length > maxLinks) { status.classList.add('mk-status__progress--red'); }
	else { status.classList.remove('mk-status__progress--red'); }
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

// function to edit a site
function renderEditSite(element, site) {
	const editForm = document.createElement('div'); editForm.classList = 'mk-form mk-form--edit';
	const nameInput = document.createElement('input'); nameInput.classList = 'mk-input';
	nameInput.type = 'text'; nameInput.value = site.name; nameInput.placeholder = 'Site name';
	const urlInput = document.createElement('input'); urlInput.classList = 'mk-input';
	urlInput.type = 'text'; urlInput.value = site.url; urlInput.placeholder = 'Site URL';
	const descInput = document.createElement('textarea'); descInput.classList = 'mk-input';
	descInput.value = site.description; descInput.placeholder = 'Site description';
	const tagsBox = document.createElement('div'); tagsBox.classList = 'mk-tags';
	const tagsInput = document.createElement('input'); tagsInput.classList = 'mk-input';
	tagsInput.type = 'text'; tagsInput.placeholder = 'Add new tag';
	tagsInput.onkeydown = (e) => {
		if(e.key === 'Enter') addNewTag(tagsInput.value, tagsInput, tagsDropdown);
	}
	const tagsDropdown = createTagsDropdown(tags, site.tags);
	const actions = document.createElement('div'); actions.classList = 'mk-actions mk-actions--form';
	const saveButton = document.createElement('button'); saveButton.classList = 'mk-button';
	saveButton.textContent = 'Save';
	saveButton.onclick = () => saveEditedSite(site, nameInput.value, urlInput.value, descInput.value, getSelectedTags(tagsDropdown));
	const cancelButton = document.createElement('button'); cancelButton.classList = 'mk-button';
	cancelButton.textContent = 'Cancel';
	cancelButton.onclick = () => cancelEditedSite(site);
	actions.appendChild(saveButton);
	actions.appendChild(cancelButton);
	editForm.appendChild(actions);
	editForm.appendChild(nameInput);
	editForm.appendChild(urlInput);
	editForm.appendChild(descInput);
	tagsBox.appendChild(tagsInput);
	tagsBox.appendChild(tagsDropdown);
	editForm.appendChild(tagsBox);
	element.replaceWith(editForm);
	element = editForm;
}

function addNewTag(newTag, tagsInput, tagsDropdown) {
	const trimmedTag = newTag.trim().toLowerCase();
	if(trimmedTag) {
		if(!tags.includes(trimmedTag)) {
			tags.push(trimmedTag);
		}
		const selectedTags = getSelectedTags(tagsDropdown);
		selectedTags.push(trimmedTag);
		updateTagsDropdown(tags, selectedTags, tagsDropdown);
		tagsInput.value = '';
	}
}

function saveEditedSite(site, name, url, desc, tags) {
	console.log(tags);
	site.name = name;
	site.url = url;
	site.description = desc;
	site.tags = tags;
	saveSites();
	updateCounts();
}

function cancelEditedSite(site) {
	renderList();
}

// function to delete a site
function deleteSite(url) {
	const index = sites.findIndex(site => site.url === url);
	if (index !== -1) {
		const loading = document.getElementById('loading');
		const gif = document.createElement('img');
		gif.src = 'assets/gif.gif';
		loading.appendChild(gif);
		setTimeout(() => {
			loading.removeChild(gif);
		}, 1500);
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
changeToSalmonButton.addEventListener('click', () => {
	applyColor('salmon');
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
	const tagsFinal = formInput4.value.trim().replaceAll(' ','-').split(',-');
	console.log(tagsFinal);
	if (name && url) {
		console.log(sites.some(site => site.url === url))
		if (sites.some(site => site.url === url)) {
			formMessage.style.display = 'block';
			formMessage.innerHTML = 'A site with this URL already exists.';
		} else {
			const url2 = !url.includes('http') ? `https://${url}` : url;
			const parsedUrl = parseUrl(url2);
			sites.push({ name, url: parsedUrl.url, description, tags: tagsFinal, count: 0 });
			tagsFinal.forEach(tag => tags.push(tag));
			tags = tags.filter((t, index) => tags.indexOf(t) == index);
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
	chrome.storage.sync.set({ sites: sites, tags: tags }, function () {
		console.log('Sites and tags saved!');
		console.log('sites',sites)
		console.log('tags',tags)
	});
}
chrome.storage.sync.get(['tags'], function(result) {
	if(result.tags) { tags = result.tags; }
});
// load saved theme on popup load
chrome.storage.sync.get(['theme'], function (result) {
	console.log('theme loaded')
	const savedTheme = result.theme || 'light';
	applyTheme(savedTheme);
});
chrome.storage.sync.get(['color'], function (result) {
	console.log('color loaded')
	const savedColor = result.color || 'teal';
	applyColor(savedColor);
});