import { w2ui, w2layout, w2toolbar, w2form, w2utils, w2confirm, w2alert, w2popup, w2sidebar, w2tabs } from "../lib/w2ui.es6.min.js";
import { NWin } from "../js/window.js";
import { SqlREST } from "../js/sqlrest.js";

w2utils.settings.dataType = "RESTFULL";

NUT.ds = SqlREST;
NUT.w2alert = w2alert;
NUT.w2confirm = w2confirm;
NUT.w2utils = w2utils;
NUT.w2ui = w2ui;
NUT.w2popup = w2popup;
NUT.w2form = w2form;
NUT.w2layout = w2layout;
NUT.w2toolbar = w2toolbar;
NUT.w2tabs = w2tabs;

window.onload = function () {
	document.body.innerHTML = "<div id='divLogin'></div>";
	w2utils.locale(localStorage.getItem(NUT.I_LANG) || w2utils.settings.locale).then(function (evt) {
		n$.lang = evt.data.locale.substr(0, 2);
		var suser = localStorage.getItem(NUT.I_USER);
		var spass = localStorage.getItem(NUT.I_PASS);
		(w2ui["frmLogin"] || new w2form({
			name: "frmLogin",
			style: "width:360px;height:220px;top:30%;margin:auto",
			header: "_NUT",
			fields: [
				{ field: 'username', type: 'text', html: { label: "_Username" } },
				{ field: 'password', type: 'password', html: { label: "_Password" } },
				{ field: 'savepass', type: 'checkbox', html: { label: "_Save password" } },
			],
			record: { username: suser, password: spass || "", savepass: spass },
			actions: [
				{
					text: "_Help",
					onClick: function () {
						window.open('help.html');
					}
				},
				{
					text: "_Login",
					class: "w2ui-btn-blue",
					onClick: function () {
						NUT.loading(divLogin);
						var rec = this.record;
						spass == rec.password ? login(rec.username, rec.password, rec.savepass) :
							w2utils.sha256(rec.password).then(function (md5) {
								login(rec.username, md5, rec.savepass);
							});
					}
				}
			]
		})).render(divLogin);
		var cboLang = document.createElement("select");
		cboLang.style = 'position:inherit;float:right';
		cboLang.innerHTML = "<option>en-US</option><option>vi-VN</option>";
		cboLang.value = evt.data.locale;
		cboLang.onchange = function () {
			localStorage.setItem(NUT.I_LANG, this.value);
			location.reload();
		}
		divLogin.appendChild(cboLang);
	})
}

function login(user, pass, save) {
	NUT.ds.login({ url: NUT.URL_TOKEN, data: [user, pass] }, function (res) {
		if (res.success) {
			n$.user = res.result;
			SqlREST.token = "Bearer " + n$.user.token;
			localStorage.setItem(NUT.I_USER, user);
			localStorage.setItem(NUT.I_PASS, save ? pass : "");

			(w2ui["layMain"] || new w2layout({
				name: "layMain",
				style: "width:100%;height:100%;top:0;margin:0",
				panels: [
					{ type: 'top', size: 38, html: '<div id="divTop" class="nut-full"></div>' },
					{ type: 'left', size: 300, resizable: true, html: '<div id="divLeft" class="nut-full"></div>', hidden: true },
					{ type: 'main', html: '<div id="divMain" class="nut-full" style="background:url(\'site/' + n$.user.siteid + '/back.png\');background-size:cover"><div id="divApp" style="position:absolute;width:100%;top:30%"></div><div id="divTool" style="position:absolute;width:100%;bottom:10px"></div></div>' }
				],
			})).render(divLogin);

			(w2ui["tbrTop"] || new w2toolbar({
				name: "tbrTop",
				items: [
					{ type: 'html', id: 'logo', html: '<img height="24" src="site/' + n$.user.siteid + '/logo.png"/>' },
					{ type: 'html', id: 'site', html: '<div><b>' + n$.user.sitename + '</b><br/>' + NUT.translate(n$.user.sitedesc) + "</div>" },
					{ type: 'spacer', id: "divSpace" },
					{ type: 'break' },
					{ type: 'button', id: "home", icon: "nut-i-home", tooltip: "_Home" },
					{ type: 'button', id: "notify", icon: "nut-i-notification", tooltip: "_Notify" },
					{ type: 'button', id: "job", icon: "nut-i-information", tooltip: "_Job" },
					{ type: 'break' },
					{
						type: 'menu', id: 'user', text: n$.user.username, items: [
							{ id: 'profile', text: '_Profile' },
							{ id: 'changepass', text: '_Change password' },
							{ text: '--' },
							{ id: 'logout', text: '_Logout' }]
					},
					{ type: 'break' },
					{ type: 'button', id: "app", icon: "nut-i-switcher", tooltip: "_Applications" }
				],
				onClick(evt) {
					if (evt.target == "user:profile") {
						w2alert("<table><tr><td><b><i>Tài khoản:</i></b></td><td colspan='3'>" + n$.user.username + "</td></tr><tr><td><b><i>Họ tên:</i></b></td><td colspan='3'>" + n$.user.fullname + "</td></tr><tr><td><b><i>Điện thoại:</i></b></td><td>" + n$.user.phone + "</td><td><b><i>Nhóm:</i></b></td><td>" + n$.user.groupid + "</td></tr><tr><td><b><i>Trạng thái:</i></b></td><td>" + n$.user.status + "</td><td><b><i>Ghi chú:</i></b></td><td>" + n$.user.description + "</td></tr></table>", "<b>ℹ️ Information #<i>" + n$.user.userid + "</i></b>");
					}
					else if (evt.target == "user:changepass") {
						w2popup.open({
							title: "🔑 <i>Change password</i>",
							speed: 0,
							width: 400,
							height: 210,
							body: "<table style='margin:auto'><tr><td>*Old password:</b></td><td><input id='txtUser_PasswordOld' type='password'/></td></tr><tr><td>*New password:</b></td><td><input id='txtUser_PasswordNew' type='password'/></td></tr><tr><td>*Re-type password:</b></td><td><input id='txtUser_PasswordNew2' type='password'/></td></tr></table>",
							buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="userChangePassword()">✔️ Ok</button>'
						});
					}
					else if (evt.target == "user:logout") {
						w2ui.layMain.hide("left");
						location.reload();
					}
				}
			})).render(divTop);

			openDesktop();
			//renderMain();
		} else NUT.notify("⛔ ERROR: " + res.result, "red");
		NUT.loading();
	}, true);
}

function openDesktop() {
	NUT.ds.select({ url: NUT.URL + "nv_access_app", orderby: "seqno", where: ["userid", "=", n$.user.userid] }, function (res) {
		if (res.success) {
			var id = null;
			var appHtml = "<center>";
			var toolHtml = "<center>";
			for (var i = 0; i < res.result.length; i++) {
				var data = res.result[i];
				if (data.appid != null) {
					if (id != data.appid) {
						id = data.appid;
						data.appname = NUT.translate(data.translate) || data.appname;
						data.description = NUT.translate(data.description);
						NUT.apps[id] = data;
						if (data.issystem) {
							toolHtml += "<div class='nut-tool' onclick='openApp(" + id + ")' title='" + data.appname + "'><img src='site/" + data.siteid + "/" + id + "/icon.png'/></div>";
						} else {
							appHtml += "<div title='" + data.description + "' class='nut-tile' style='background:" + data.color + "' onclick='openApp(" + id + ")'><br/><img src='site/" + data.siteid + "/" + id + "/icon.png'/><br/>" + data.appname + "</div>";
						}
					}
				}
			};
			divApp.innerHTML = appHtml + "</center>";
			divTool.innerHTML = toolHtml + "</center>";

			//if (res.length == 1) openApplication(id);
		} else NUT.notify("⛔ ERROR: " + res.result, "red");
	});
}

function userChangePassword() {
	var user = n$.user;
	if (txtUser_PasswordOld.value && txtUser_PasswordNew.value && txtUser_PasswordNew2.value) {
		if (txtUser_PasswordOld.value == user.password && txtUser_PasswordNew.value == txtUser_PasswordNew2.value)
			NUT.ds.update({ url: NUT.URL + "n_user", data: { password: txtUser_PasswordNew.value }, where: [["userid", "=", user.userid], ["password", "=", txtUser_PasswordOld.value]] }, function (res) {
				if (res.success)
					NUT.alert("<span style='color:green'>Password change!</span>");
				else
					NUT.notify("⛔ ERROR: " + res.result, "red");
			})
		else w2alert("<span style='color:orange'>Passwords not match!</span>");
	} else w2alert("<span style='color:orange'>Old password, new password and retype password are all required!</span>");
}

window.openApp = function (id) {
	//load menu
	n$.app = NUT.apps[id];

	if (n$.app.apptype == "engine") {
		window.open(n$.app.link + "?username=" + n$.user.username + "&siteid=" + n$.user.siteid);
		labCurrentApp.innerHTML = "";
	} else {
		tb_tbrTop_item_divSpace.innerHTML = divTool.innerHTML;
		var isGis = (n$.app.apptype == "gis");
		divMain.innerHTML = '<div id="divTitle" style="padding:6px"><img width="64" height="64" src="site/' + n$.app.siteid + '/' + id + '/icon.png"/><br/><h2><b style="color:brown">' + n$.app.appname + '</b></h2><br/><hr/><br/><h3>' + n$.app.description + '</h3></div>';
		divMain.style.backgroundImage = "";
		var where = ["appid", "=", id];
		if (isGis) {
			NUT.ds.select({ url: NUT.URL + "nv_map_service", orderby: "seqno", where: where }, function (res) {
				if (res.success) {
					var maps = res.result;
					var lookup = {};
					for (var i = 0; i < maps.length; i++) {
						var map = maps[i];
						map.subLayers = [];
						lookup[map.mapid] = map;
					}
					NUT.ds.select({ url: NUT.URL + "n_layer", orderby: "seqno", where: where }, function (res2) {
						if (res2.success) {
							for (var i = 0; i < res2.result.length; i++) {
								var lyr = res.result[i];
								lyr.maporder = lookup[lyr.mapid].seqno;
								lookup[lyr.mapid].subLayers.push(lyr);
							}
							var layers = [];
							for (var i = 0; i < maps.length; i++)if (maps[i].subLayers.length) layers.push(maps[i]);
							divMain.innerHTML = "<div id='divMapTool'></div>";
							w2ui.divApp.sizeTo("left", "50%", true);
							GSMap.createMap({
								layers: layers,
								divMap: divMain,
								divTool: divMapTool,
								view: {
									center: [108, 16],
									zoom: 11
								}
							});
							GSMap.awBasic.onFeatureSelect = map_onSelect;
						} else NUT.notify("⛔ ERROR: " + res2.result, "red");
					})
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		//cache domain
		NUT.ds.select({ url: NUT.URL + "n_domain", where: where }, function (res) {
			if (res.success) {
				NUT.domains = NUT.configDomain(res.result);
				NUT.domains[0] = {
					items: [{ id: n$.user.siteid, text: n$.user.sitecode }],
					lookdown: { [n$.user.sitecode]: n$.user.siteid },
					lookup: { [n$.user.siteid]: n$.user.sitecode }
				};
			} else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		//cache service
		NUT.ds.select({ url: NUT.URL + "nv_appservice_service", where: where }, function (res) {
			if (res.success) {
				NUT.services = {};
				for (var i = 0; i < res.result.length; i++) {
					var service = res.result[i];
					NUT.services[service.serviceid] = service;
				}
				//cache table
				NUT.ds.select({ url: NUT.URL + "nv_appservice_table", where: where }, function (res2) {
					if (res2.success) {
						NUT.tables = {};
						var tableIds = [];
						for (var i = 0; i < res2.result.length; i++) {
							var table = res2.result[i];
							var url = NUT.services[table.serviceid].url + "data/";
							table.urlview = url + (table.viewname || table.tablename);
							table.urledit = url + table.tablename;
							NUT.tables[table.tableid] = table;
							if(table.tabletype == "relate")tableIds.push(table.tableid);
						}
						//cache relate
						if (tableIds.length) NUT.ds.select({ url: NUT.URL + "n_column", where: [["linktableid", "!is", null], ["tableid", "in", tableIds]] }, function (res3) {
							if (res3.success) {
								NUT.relates = {};
								var lookupColumn = {};
								for (var i = 0; i < res3.result.length; i++) {
									var col = res3.result[i];
									if (!lookupColumn[col.tableid]) lookupColumn[col.tableid]= [col];
									else lookupColumn[col.tableid][1] = col;
								}
								for (var key in lookupColumn) if (lookupColumn.hasOwnProperty(key)) {
									var rel = lookupColumn[key];
									NUT.relates[rel[0].linktableid+"_"+rel[1].linktableid] = rel;
								}
							} else NUT.notify("⛔ ERROR: " + res3.result, "red");
						});
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		
		NUT.ds.select({ url: NUT.URL + "nv_rolemenu_menu", where: [["appid", "=", id], ["roleid", "=", n$.app.roleid], ["menutype", "=", "menu"]] }, function (res) {
			if (res.success) {
				var ids = {}, pids = {};
				for (var i = 0; i < res.result.length; i++) {
					var rec = res.result[i];
					if (rec.menuid) ids[rec.menuid] = true;
					if (rec.parentid) pids[rec.parentid] = true;
				}
				var pkeys = Object.keys(pids);
				var where = (pkeys.length ? ["or", ["menuid", "in", Object.keys(ids)], ["menuid", "in", pkeys]] : ["menuid", "in", Object.keys(ids)]);
				NUT.ds.select({ url: NUT.URL + "n_menu", orderby: "seqno", where: where }, function (res2) {
					if (res2.success) {
						var nodes = [], lookup = {}, openWinId = null;
						for (var i = 0; i < res2.result.length; i++) {
							var menu = res2.result[i];
							if (menu.linkwindowid && menu.isopen) openWinId = menu.linkwindowid;
							var node = { id: menu.menuid, text: NUT.translate(menu.translate) || menu.menuname, expanded: menu.isopen, tag: menu.linkwindowid || menu.execname, where: JSON.parse(menu.whereclause) };
							if (menu.parentid) {
								var parent = lookup[menu.parentid];
								parent.group = true;
								if (parent.nodes) parent.nodes.push(node);
								else parent.nodes = [node];
							} else nodes.push(node);
							lookup[node.id] = node;
						};

						if (id == 0) {//LIST SYSTEM APPLICATIONS
							var childs = [];
							for (var key in NUT.apps) if (NUT.apps.hasOwnProperty(key)) {
								var app = NUT.apps[key];
								if (app.siteid == n$.user.siteid) childs.push({ id: "app_" + app.appid, text: app.appname, tag: (app.apptype == "engine" ? 5 : 3), where: ["appid", "=", app.appid] });
							}
							nodes.push({ id: "app_", text: "_Applications", group: true, expanded: true, nodes: childs });
						}

						(w2ui["mnuMain"] || new w2sidebar({
							name: "mnuMain",
							flatButton: true,
							nodes: nodes,
							//topHTML: '<input placeholder="⌕ Search..." style="width:100%"/>',
							onClick: menu_onClick,
							onFlat: function (evt) {
								var width = NUT.isMobile ? "100%" : "300px";
								w2ui.layMain.sizeTo("left", evt.detail.goFlat ? '40px' : width, true);
								divLeft.style.width = (evt.detail.goFlat ? '40px' : width);
							}
						})).render(divLeft);

						w2ui.layMain.show("left");
						if (openWinId) menu_onClick({ item: { tag: openWinId } });
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}
function map_onSelect(evt) {
	if (evt.tool == "toolSelect") {
		var tabconf = NUT.windows[n$.windowid].tabs[0];
		var grid = w2ui["grid_" + tabconf.tabid];
		var where = ["or"];
		for (var i = 0; i < evt.features.length; i++) {
			var feat = evt.features[i];
			var lyrconf = GSMap.getLayerConfig(feat.getId().split(".")[0]);
			if (lyrconf.windowid == n$.windowid) {
				var attr = feat.getProperties();
				var clause = [];
				for (var j = 0; j < tabconf.fields.length; j++) {
					var field = tabconf.fields[j];
					if (field.columndohoa && attr[field.columndohoa]) {
						if (attr[field.columndohoa]) clause.push([field.columndohoa, "=", attr[field.columndohoa]]);
						else { clause = []; break }
					}
				}
				if (clause.length) where.push(clause);
			}
		}
		if (where.length > 1) {
			grid.postData.select = where;
			grid.reload();
		}
	}
}

function menu_onClick(evt) {
	var tag = evt.object.tag;
	if (Number.isInteger(tag)) {
		var appName = Number.isInteger(evt.object.id) ? undefined : evt.object.text;
		var conf = NUT.windows[tag];
		var a = NUT.createWindowTitle(tag, divTitle, appName);
		if (!a) {//already open
			if (appName) {
				var grid = NUT.w2ui["grid_" + conf.tabs[0].tabid];
				grid.tab.tag.tempWhere = evt.object.where;
				grid.reload();
			}
			return;
		}
		var win = new NWin(tag);
		if (conf) {
			conf.tabs[0].tempWhere = evt.object.where;
			win.buildWindow(a.div, conf, 0);
			a.innerHTML = conf.windowname;
		} else {
			NUT.ds.select({ url: NUT.URL + "n_cache", where: ["windowid", "=", tag] }, function (res) {
				if (res.success) {
					var cache = res.result[0];
					if (cache) {
						conf = NUT.configWindow(zipson.parse(cache.configjson), JSON.parse(cache.layoutjson));
						conf.tabs[0].tempWhere = evt.object.where;
						conf.tabid = conf.windowid;
						conf.windowname = NUT.translate(conf.translate) || conf.windowname;
						NUT.windows[tag] = conf;
						var needCaches = [];
						for (var key in conf.needCache) {
							if (conf.needCache.hasOwnProperty(key) && !NUT.domains[key]) needCaches.push(conf.needCache[key]);
						}
						//win.cacheDomainAndOpenWindow(a.div, conf, needCaches, 0);
						win.buildWindow(a.div, conf, 0);
						a.innerHTML = appName || conf.windowname;
					} else NUT.notify("⚠️ No cache for window " + tag, "yellow");
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		if (NUT.isMobile && !w2ui.w2menu.flat) w2ui.w2menu.goFlat();
		n$.windowid = tag;
	} else {
		NUT.runComponent(tag);
	}
}

function linkfield_onClick(windowid, value, wherefield) {
	menu_onClick({ item: { tag: windowid }, object: { where: [wherefield, "=", value] } });
	event.stopImmediatePropagation();
}