function loadHomePhoto() {
    var num = Math.floor( Math.random() * 4)+1;
    document.getElementById("home-photo").innerHTML = ('<img src="/assets/img/me/skip' + num + '.jpg">')
}
