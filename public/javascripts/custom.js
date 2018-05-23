document.title = 'Notify ME | TenTwenty';

const changeFavicon = link => {
  let $favicon = document.querySelector('link[rel="icon"]')
  // If a <link rel="icon"> element already exists,
  // change its href to the given link.
  if ($favicon !== null) {
    $favicon.href = link
  // Otherwise, create a new element and append it to <head>.
  } else {
    $favicon = document.createElement("link")
    $favicon.rel = "icon"
    $favicon.href = link
    document.head.appendChild($favicon)
  }
}

changeFavicon("https://www.tentwenty.me/application/files/2214/9318/5980/favicon.png")
