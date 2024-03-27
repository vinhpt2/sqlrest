function body_onLoad(){
	var id="divApp";
	var div=document.getElementById(id);
	w2ui[id]?w2ui[id].render(div):
	$(div).w2layout({
		name: id,
		panels: [
			{ type: 'top', size: '28px', content: '<div id="divTop"></div>' },
			{ type: 'main', content: '<div id="divMain" class="nut-full" style="background:url(\'../img/nutboat.jpg\') no-repeat;background-size:cover"><div id="divTitle" style="padding:20px"><img width="64" height="64" src="../img/nut.ico"/><h2 style="color:brown">NUT version 1.0<h2/><hr/><h3><i>No-code Universal application Tools</i><h3/></div></div>' },
			{ type: 'bottom', size: '24px', content: '<div id="divBottom"></div>'}
		]
	});
}
