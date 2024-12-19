var DailySanLuongReport={
	run:function(p){		
		var now=new Date();
		NUT.w2popup.open({
			title: '📜 <i>Daily Sản lượng Report</i>',
			modal:true,
			width: 360,
			height: 220,
			body: "<table style='margin:auto'><tr><td>Năm</td><td><input id='num_Year' style='width:60px' type='number' value='"+now.getFullYear()+"'/></td><td>Tháng</td><td><input id='num_Month' style='width:60px' type='number' value='"+(now.getMonth()+1)+"'/></td></tr><tr><td>Đối tác</td><td>HABECO</td>"+(n$.user.orgid?"<td></td><td>":"<td>Thị trường</td><td><select id='cbo_ThiTruong'><option value='ĐBSH' selected>ĐBSH</option><option value='ĐTBB'>ĐTBB</option></select>")+"</td></tr><tr><td>Vị trí</td><td colspan='3'><select id='cbo_ViTriLv'><option value='BA' selected>BA</option><option value='BA_'>BA_PartTime</option></select></td></tr><tr><td></td><td colspan='3'><input id='chk_Edit' type='checkbox'/><label for='chk_Edit'>Dùng dữ liệu Hiệu chỉnh</label></td></tr></table>",
			buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="DailySanLuongReport.runReport()">✔️ Report</button>'
		})
	},
	runReport:function(){
		if(num_Year.value&&num_Month.value){
			var vitrilv=cbo_ViTriLv.value;
			var nam=num_Year.value;
			var thang=num_Month.value;
			var date=nam+"-"+thang+"-15";
			var url=NUT.services[2].url;
			NUT.ds.select({url:url+"data/chucvuhabeco",where:[["machucvu","in","TF,TL,GDCN"],(n$.user.orgid?["makhuvuc","in",n$.user.orgid]:["thitruong","=",cbo_ThiTruong.value]),["or",["ngaybatdau","is","null"],["ngaybatdau","<=",date]],["or",["ngayketthuc","is","null"],["ngayketthuc",">=",date]]]},function(cvs){
				var lookupTL={},lookupTF={},gdcn=null;
				for(var i=0;i<cvs.length;i++){
					var cv=cvs[i];
					if(cv.machucvu=="TL")lookupTL[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="TF")lookupTF[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="GDCN")gdcn=cv.hoten;
				}
			
				var where=[["nam","=",nam],["thang","=",thang],["madoitac","=","HABECO"],(n$.user.orgid?["makhuvuc","in",n$.user.orgid]:["thitruong","=",cbo_ThiTruong.value])];
				NUT.ds.select({url:url+"data/chitieu",where:where},function(chitieu){
					//if(chitieu.length){
						var lookupChiTieu={};
						for(var i=0;i<chitieu.length;i++){
							var ct=chitieu[i];
							lookupChiTieu[ct["manhanvien"]]=ct;
						}
						where.push(vitrilv=="BA"?["vitrilv","=",vitrilv]:["vitrilv","like",vitrilv+"*"]);
						where.push(["dulieu","=",chk_Edit.checked?1:0]);
						NUT.ds.select({url:url+"data/rpt_weeklysanluong",where:where},function(week){
							if(week.length){
								var lookupWeek={};
								var min=9999;
								for(var i=0;i<week.length;i++){
									var wk=week[i];
									lookupWeek[wk["manhanvien"]+wk["madiemban"]+wk["tuan"]]=wk;
									if(wk["tuan"]<min)min=wk["tuan"];
								}
								NUT.ds.select({url:url+"data/rpt_dailysanluong",where:where},function(res){
									if(res.length){
										var win=window.open("client/"+n$.user.clientid+"/"+n$.curApp.applicationid+"/DailySanLuongReport.html");
										win.onload=function(){
											this.labGDCN.innerHTML=gdcn;
											this.labThangNam.innerHTML=thang+"/"+nam;
											this.labThiTruong.innerHTML=n$.user.orgid?n$.user.kvhcnames:cbo_ThiTruong.value;
											this.labNgayBaoCao.innerHTML=(new Date()).toLocaleString();
											var oldMaNhanVien=null;
											var oldMaDiemBan=null;
											var row=null;
											var sp=["bold","light","boldl","lightl","trucbach","hanoipre"];
											var dv=[20,20,24,24,24,20];
											var total=[],totalct=[0,0,0,0,0,0,0,0,0],totalwk=[];
											for(var j=0;j<sp.length;j++)total[sp.length*31+j+1]=0;
											for(var j=0;j<(sp.length+1)*5;j++)totalwk[j]=0;
											var sum=[0,0,0,0,0,0],sumTrongDiem=0,sumct=0;
											var grandTotal=0,grandSum=0;
											var stt=0,ct=null;
											var length=sp.length*32+1;
											var max=length+6*(sp.length+1)+2;
											var nvRow=null,nvSum=0,sumCtTrongDiem=0, sumNvTrongDiem=0;
											for(var i=0;i<res.length;i++){
												var rec=res[i];
												if(rec.manhanvien!=oldMaNhanVien||rec.madiemban!=oldMaDiemBan){
													if(row){
														if(ct){
															sumCtTrongDiem=ct.bold+ct.light;
															row.cells[sp.length*35+1].innerHTML=sumCtTrongDiem;
															totalct[0]+=ct.bold;totalct[1]+=ct.light;totalct[2]+=ct.trucbach;totalct[3]+=ct.hanoipre;
															totalct[4]+=ct.bold+ct.light+ct.trucbach+ct.hanoipre;
															totalct[6]+=sumCtTrongDiem;
															totalct[7]+=sumTrongDiem;
														}
														row.cells[sp.length*35+2].innerHTML=Math.round(10*sumTrongDiem)/10;
														var sumwk=[0,0,0,0,0];
														for(var j=0;j<=sp.length;j++){
															row.cells[sp.length*33+j].innerHTML="<b>"+Math.round((j==sp.length?grandSum:sum[j])*10)/10+"</b>";
															if(ct&&ct[sp[j]]!=undefined){
																sumct+=ct[sp[j]];
																row.cells[sp.length*34+j+(j<2?1:-1)].innerHTML=ct[sp[j]];
															}
															if(ct&&j==sp.length){
																row.cells[sp.length*34+j-1].innerHTML="<b>"+sumct+"</b>";
															}
															for(var k=0;k<5;k++){
																var wk=lookupWeek[oldMaNhanVien+oldMaDiemBan+(min+k)];
																if(wk){
																	var ket=wk[sp[j]]/dv[j];
																	if(j<sp.length)sumwk[k]+=ket;
																	row.cells[sp.length*(36+k)+j+k-2].innerHTML=(j==sp.length?"<b>"+Math.round(sumwk[k]*10)/10+"</b>":Math.round(ket*10)/10);
																	totalwk[k*(sp.length+1)+j]+=(j==sp.length)?sumwk[k]:ket;
																}
															}
														}
														grandTotal+=grandSum;
													}
													
													if(rec.manhanvien!=oldMaNhanVien){
														if(sumct)nvRow.cells[sp.length*34+sp.length].innerHTML="<b>"+Math.round(100*nvSum/sumct)+"%</b>";
														if(sumCtTrongDiem)nvRow.cells[sp.length*35+3].innerHTML=Math.round(100*sumNvTrongDiem/sumCtTrongDiem)+"%";
														
														ct=lookupChiTieu[rec.manhanvien];
														sumNvTrongDiem=0;
														sumCtTrongDiem=0;
														nvSum=0;
														sumct=0;
													} else ct=null;
													
													row=this.tblData.insertRow();
													row.innerHTML="<td align='center'>"+(++stt)+"</td><td>"+rec.dms+"</td><td>"+rec.thitruong+"</td><td>"+(lookupTF[rec.makhuvuc]||lookupTL[rec.makhuvuc])+"</td><td class='frozen'>"+rec.hoten+"</td><td align='center'>"+rec.sohoso+"</td><td>"+rec.loaihinh+"</td><td class='frozen2'>"+rec.tendiemban+"</td><td>"+rec.sonha+"</td><td>"+rec.duong+"</td><td>"+rec.huyen+"</td><td>"+rec.tenkhuvuc+"</td>";													
													for(var j=0;j<max;j++)row.insertCell().align="center";
													if(rec.manhanvien!=oldMaNhanVien)nvRow=row;
													
													oldMaNhanVien=rec.manhanvien;
													oldMaDiemBan=rec.madiemban;
													sum=[0,0,0,0,0,0];
													grandSum=0;
													sumTrongDiem=0;
												}
												if(rec.ngay){
													var offset=sp.length*(rec.ngay-1)+1;
													for(var j=0;j<sp.length;j++){
														if(total[offset+j]==undefined)total[offset+j]=0
														var sl=rec[sp[j]];
														if(sl){
															row.cells[offset+j+11].innerHTML=sl;
															total[offset+j]+=sl;
															var ket=sl/dv[j];
															total[sp.length*31+j+1]+=ket;
															sum[j]+=ket;
															grandSum+=ket;
															nvSum+=ket;
															if(j<4){
																sumTrongDiem+=ket;
																sumNvTrongDiem+=ket;
															}
														}
													}
												}
											}
											if(row){
												if(ct){
													sumCtTrongDiem=ct.bold+ct.light;
													row.cells[sp.length*35+1].innerHTML=sumCtTrongDiem;
													totalct[0]+=ct.bold;totalct[1]+=ct.light;totalct[2]+=ct.trucbach;totalct[3]+=ct.hanoipre;
													totalct[4]+=ct.bold+ct.light+ct.trucbach+ct.hanoipre;
													totalct[6]+=sumCtTrongDiem;
													totalct[7]+=sumTrongDiem;
												}
												row.cells[sp.length*35+2].innerHTML=Math.round(10*sumTrongDiem)/10;
												var sumwk=[0,0,0,0,0];
												for(var j=0;j<=sp.length;j++){
													row.cells[sp.length*33+j].innerHTML="<b>"+Math.round((j==sp.length?grandSum:sum[j])*10)/10+"</b>";
													if(ct&&ct[sp[j]]!=undefined){
														sumct+=ct[sp[j]];
														row.cells[sp.length*34+j+(j<2?1:-1)].innerHTML=ct[sp[j]];
													}
													if(ct&&j==sp.length){
														row.cells[sp.length*34+j-1].innerHTML="<b>"+sumct+"</b>";
													}
													for(var k=0;k<5;k++){
														var wk=lookupWeek[rec.manhanvien+rec.madiemban+(min+k)];
														if(wk){
															var ket=wk[sp[j]]/dv[j];
															if(j<sp.length)sumwk[k]+=ket;
															row.cells[sp.length*(36+k)+j+k-2].innerHTML=(j==sp.length?"<b>"+Math.round(sumwk[k]*10)/10+"</b>":Math.round(ket*10)/10);
															totalwk[k*(sp.length+1)+j]+=(j==sp.length)?sumwk[k]:ket;
														}
													}
												}
												grandTotal+=grandSum;
											}
											if(rec.manhanvien!=oldMaNhanVien){
												if(sumct)nvRow.cells[sp.length*34+sp.length].innerHTML="<b>"+Math.round(100*nvSum/sumct)+"%</b>";
												if(sumCtTrongDiem)nvRow.cells[sp.length*35+3].innerHTML=Math.round(100*sumNvTrongDiem/sumCtTrongDiem)+"%";
											}
											
											row=this.tblData.insertRow();
											row.innerHTML="<td colspan='12' align='right'><b>Tổng cộng: </b></td>";
											for(var i=1;i<=length;i++){
												var cell=row.insertCell();
												cell.align="center";
												cell.innerHTML="<b>"+Math.round((i==length?grandTotal:(total[i]?total[i]:0))*10)/10+"</b>";
											}
											for(var i=0;i<totalct.length;i++){
												var cell=row.insertCell();
												cell.align="center";
												cell.innerHTML="<b>"+Math.round(totalct[i]*10)/10+"</b>";
											}
											for(var i=0;i<5*(sp.length+1);i++){
												var cell=row.insertCell();
												cell.align="center";
												cell.innerHTML="<b>"+Math.round(totalwk[i]*10)/10+"</b>";
											}
										}
									} else NUT.notify("⚠️ No data to report!","yellow");
								});
							} else NUT.notify("⚠️ No week data to report. Run calculate!","yellow");
						});
					//} else NUT.notify("Không có dữ liệu chỉ tiêu!","yellow");
				});
			});
		} else NUT.tagMsg("Nhập năm, tháng trước khi thực hiện!","yellow");
	}
}