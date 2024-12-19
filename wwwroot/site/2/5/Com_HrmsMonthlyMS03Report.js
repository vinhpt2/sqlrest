var Com_HrmsMonthlyMS03Report={
	run:function(p){
		
		var now=new Date();
		w2popup.open({
			title: '📜 <i>Monthly MS03 - Chỉ tiêu Sản lượng Report</i>',
			modal:true,
			width: 360,
			height: 220,
			body: "<table style='margin:auto'><tr><td>Năm</td><td><input id='numTinhCong_Year' style='width:60px' type='number' value='"+now.getFullYear()+"'/></td><td>Tháng</td><td><input id='numTinhCong_Month' style='width:60px' type='number' value='"+(now.getMonth()+1)+"'/></td></tr><tr><td>Đối tác</td><td>HABECO</td>"+(_context.user.kvhcs.length?"<td></td><td>":"<td>Thị trường</td><td><select id='cboTinhCong_ThiTruong'><option value='ĐBSH' selected>ĐBSH</option><option value='ĐTBB'>ĐTBB</option></select>")+"</td></tr><tr><td>Vị trí</td><td colspan='3'><select id='cboTinhCong_ViTriLv'><option value='BA' selected>BA</option><option value='BA_'>BA_PartTime</option></select></td></tr><tr><td></td><td colspan='3'><input id='chkTinhCong_Edit' type='checkbox'/><label for='chkTinhCong_Edit'>Dùng dữ liệu Hiệu chỉnh</label></td></tr></table>",
			buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="Com_HrmsMonthlyMS03Report.runReport()">✔️ Report</button>'
		})
	},
	runReport:function(){
		var DINHMUC_NC=26;
		if(numTinhCong_Year.value&&numTinhCong_Month.value){
			var url=_context.service["hrms"].urledit;
			var nam=numTinhCong_Year.value;
			var thang=numTinhCong_Month.value;
			var date=nam+"-"+thang+"-15";
			NUT_DS.select({url:url+"chucvu_v",where:[["machucvu","in","TF,TL,GDCN"],(_context.user.kvhcs.length?["makhuvuc","in",_context.user.kvhcs]:["thitruong","=",cboTinhCong_ThiTruong.value]),["or",["ngaybatdau","is","null"],["ngaybatdau","<=",date]],["or",["ngayketthuc","is","null"],["ngayketthuc",">=",date]]]},function(cvs){
				var lookupTL={},lookupTF={},gdcn=null;
				for(var i=0;i<cvs.length;i++){
					var cv=cvs[i];
					if(cv.machucvu=="TL")lookupTL[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="TF")lookupTF[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="GDCN")gdcn=cv.hoten;
				}
				var vitrilv=cboTinhCong_ViTriLv.value;
				
				var where=[["nam","=",nam],["thang","=",thang],["madoitac","=","HABECO"],(_context.user.kvhcs.length?["makhuvuc","in",_context.user.kvhcs]:["thitruong","=",cboTinhCong_ThiTruong.value])];
				NUT_DS.select({url:url+"chitieu_v",where:where},function(chitieu){
					//if(chitieu.length){
					var lookupChiTieu={};
					for(var i=0;i<chitieu.length;i++){
						var ct=chitieu[i];
						lookupChiTieu[ct["manhanvien"]]=ct;
					}
				
					NUT_DS.select({url:url+"rpt_weeklysanluong",where:[["nam","=",nam],["thang","=",thang],["madoitac","=","HABECO"],(_context.user.kvhcs.length?["makhuvuc","in",_context.user.kvhcs]:["thitruong","=",cboTinhCong_ThiTruong.value]),[["nam","=",nam],["thang","=",thang],["madoitac","=","HABECO"],(_context.user.kvhcs.length?["makhuvuc","in",_context.user.kvhcs]:["thitruong","=",cboTinhCong_ThiTruong.value]),(vitrilv=="SM"||vitrilv=="BA"?["vitrilv","=",vitrilv]:["vitrilv","like",vitrilv+"*"]),["dulieu","=",vitrilv=="SM"?-1:(chkTinhCong_Edit.checked?1:0)]],["dulieu","=",chkTinhCong_Edit.checked?1:0]]},function(res){
						if(res.length){
							var win=window.open("client/"+_context.user.clientid+"/"+_context.curApp.applicationid+"/MonthlyMS03Report.html");
							win.onload=function(){
								this.labGDCN.innerHTML=gdcn;
								this.labThangNam.innerHTML="THÁNG "+thang+" NĂM "+nam;
								this.labThiTruong.innerHTML=_context.user.kvhcs.length?_context.user.kvhcnames:cboTinhCong_ThiTruong.value;
								this.labNgayBaoCao.innerHTML=(new Date()).toLocaleString();
								var oldMaNhanVien=null;
								var oldMaDiemBan=null;
								var oldTuan=null;
								var row=null;
								var total=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
								var sumSanLuong=0,sumTrongDiem=0;
								var wSanLuong=[], nvNgayCong=0;
								var stt=0,ct=null;
								for(var i=0;i<res.length;i++){
									var rec=res[i];
									if(rec.manhanvien!=oldMaNhanVien){
										if(row){
											row.cells[10].innerHTML=DINHMUC_NC;
											row.cells[11].innerHTML=nvNgayCong;
											if(ct){
												row.cells[33+5].innerHTML=ct.bold;
												row.cells[34+5].innerHTML=ct.light;
												row.cells[35+5].innerHTML=ct.trucbach;
												row.cells[36+5].innerHTML=ct.hanoipre;
												row.cells[37+5].innerHTML=ct.hanoiprel;
												row.cells[38+5].innerHTML=ct.bold+ct.light+ct.trucbach+ct.hanoipre+ct.hanoiprel;
												row.cells[39+5].innerHTML=ct.bold+ct.light;
											}
											
											if(oldMaDiemBan!=rec.madiemban){
												row.cells[4].innerHTML+="<br/>"+rec.loaihinh;
												row.cells[5].innerHTML+="<br/>"+rec.tendiemban;
												row.cells[6].innerHTML+="<br/>"+rec.sonha;
												row.cells[7].innerHTML+="<br/>"+rec.duong;
												row.cells[8].innerHTML+="<br/>"+rec.huyen;
												
											}
											var offset=0;
											for (var tuan=0;tuan<wSanLuong.length;tuan++){
												var wSL=wSanLuong[tuan];
												if(wSL){
													row.cells[12+offset].innerHTML=Math.round(10*wSL.bold)/10;
													row.cells[13+offset].innerHTML=Math.round(10*wSL.light)/10;
													row.cells[14+offset].innerHTML=Math.round(10*wSL.trucbach)/10;
													row.cells[15+offset].innerHTML=Math.round(10*wSL.hanoipre)/10;
													row.cells[16+offset].innerHTML=Math.round(10*wSL.hanoiprel)/10;
													
													total[2+offset]+=wSL.bold;
													total[3+offset]+=wSL.light;
													total[4+offset]+=wSL.trucbach;
													total[5+offset]+=wSL.hanoipre;
													total[6+offset]+=wSL.hanoiprel;									
													offset+=5;
												}
											}
											
											row.cells[32+5].innerHTML="<b>"+Math.round(sumSanLuong*10)/10+"</b>";
											total[22+5]+=sumSanLuong;
											row.cells[39+5].innerHTML="<b>"+Math.round(sumTrongDiem*10)/10+"</b>";
											row.cells[40+5].innerHTML="B&L";
											total[29+5]+=sumTrongDiem;
											total[0]+=DINHMUC_NC;
											
											
											wSanLuong=[];
										}
										row=this.tblData.insertRow();
										row.innerHTML="<td align='center'>"+(++stt)+"</td><td>"+(lookupTF[rec.makhuvuc]||lookupTL[rec.makhuvuc])+"</td><td class='frozen'>"+rec.hoten+"</td><td align='center'>"+rec.sohoso+"</td><td>"+rec.loaihinh+"</td><td class='frozen2'>"+rec.tendiemban+"</td><td>"+rec.sonha+"</td><td>"+rec.duong+"</td><td>"+rec.huyen+"</td><td>"+rec.tenkhuvuc+"</td>";
										for(var j=0;j<total.length;j++)row.insertCell().align="center";
										oldMaNhanVien=rec.manhanvien;
										sumSanLuong=0;
										sumTrongDiem=0;
										nvNgayCong=0;
										ct=lookupChiTieu[rec.manhanvien];
										oldTuan=null;
									}
									
									//console.log(offset,rec);
									var sanluong=rec.bold/20+rec.boldl/24+rec.light/20+rec.lightl/24+rec.trucbach/24+rec.hanoipre/20+rec.hanoiprel/24;
									sumSanLuong+=sanluong;
									var sltrongdiem=rec.bold/20+rec.boldl/24+rec.light/20+rec.lightl/24;
									sumTrongDiem+=sltrongdiem;
									
									if(!wSanLuong[rec.tuan]) wSanLuong[rec.tuan]={bold:0,light:0,trucbach:0,hanoipre:0,hanoiprel:0};
									wSanLuong[rec.tuan].bold+=rec.bold/20+rec.boldl/24;
									wSanLuong[rec.tuan].light+=rec.light/20+rec.lightl/24;
									wSanLuong[rec.tuan].trucbach+=rec.trucbach/24;
									wSanLuong[rec.tuan].hanoipre+=rec.hanoipre/20;
									wSanLuong[rec.tuan].hanoiprel+=rec.hanoiprel/24;
									
									total[1]+=rec.ngaycong;
									nvNgayCong+=rec.ngaycong;
								}
								
								if(row){
									row.cells[10].innerHTML=DINHMUC_NC;
									row.cells[11].innerHTML=nvNgayCong;
									if(ct){
										row.cells[33+5].innerHTML=ct.bold;
										row.cells[34+5].innerHTML=ct.light;
										row.cells[35+5].innerHTML=ct.trucbach;
										row.cells[36+5].innerHTML=ct.hanoipre;
										row.cells[37+5].innerHTML=ct.hanoiprel;
									}
									row.cells[38+5].innerHTML=rec.sanluongkhoan;
									row.cells[39+5].innerHTML=rec.sltrongdiem;
									if(oldMaDiemBan!=rec.madiemban){
										row.cells[4].innerHTML+="<br/>"+rec.loaihinh;
										row.cells[5].innerHTML+="<br/>"+rec.tendiemban;
										row.cells[6].innerHTML+="<br/>"+rec.sonha;
										row.cells[7].innerHTML+="<br/>"+rec.duong;
										row.cells[8].innerHTML+="<br/>"+rec.huyen;
										
									}
									var offset=0;
									for (var tuan=0;tuan<wSanLuong.length;tuan++){
										var wSL=wSanLuong[tuan];
										if(wSL){
											row.cells[12+offset].innerHTML=Math.round(10*wSL.bold)/10;
											row.cells[13+offset].innerHTML=Math.round(10*wSL.light)/10;
											row.cells[14+offset].innerHTML=Math.round(10*wSL.trucbach)/10;
											row.cells[15+offset].innerHTML=Math.round(10*wSL.hanoipre)/10;
											row.cells[16+offset].innerHTML=Math.round(10*wSL.hanoiprel)/10;
											
											total[2+offset]+=wSL.bold;
											total[3+offset]+=wSL.light;
											total[4+offset]+=wSL.trucbach;
											total[5+offset]+=wSL.hanoipre;
											total[6+offset]+=wSL.hanoiprel;
											offset+=5;
										}
									}
									
									row.cells[32+5].innerHTML="<b>"+Math.round(sumSanLuong*10)/10+"</b>";
									total[22+5]+=sumSanLuong;
									row.cells[39+5].innerHTML="<b>"+Math.round(sumTrongDiem*10)/10+"</b>";
									row.cells[40+5].innerHTML="B&L";
									total[29+5]+=sumTrongDiem;
									total[0]+=DINHMUC_NC;
									
								}
								row=this.tblData.insertRow();
								row.innerHTML="<td colspan='10' align='right'><b>Tổng cộng: </b></td>";
								for(var i=0;i<total.length;i++){
									var cell=row.insertCell();
									cell.innerHTML="<b>"+Math.round(total[i]*10)/10+"</b>";
								}
								
							}
						} else NUT.tagMsg("No data to report!","yellow");
					});
				});
			});
		} else NUT.tagMsg("Nhập năm, tháng trước khi thực hiện!","yellow");
	}
}