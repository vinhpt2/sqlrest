var DailyChamCongReport={
	run:function(p){
		var now=new Date();
		NUT.w2popup.open({
			title: '📜 <i>Daily Chấm công Report</i>',
			modal:true,
			width: 360,
			height: 220,
			body: "<table style='margin:auto'><tr><td>Năm</td><td><input id='numTinhCong_Year' style='width:60px' type='number' value='" + now.getFullYear() + "'/></td><td>Tháng</td><td><input id='numTinhCong_Month' style='width:60px' type='number' value='" + (now.getMonth() + 1) + "'/></td></tr><tr><td>Đối tác</td><td>HABECO</td>" + (n$.user.orgid ? "<td></td><td>" : "<td>Thị trường</td><td><select id='cboTinhCong_ThiTruong'><option value='ĐBSH' selected>ĐBSH</option><option value='ĐTBB'>ĐTBB</option></select>") + "</td></tr><tr><td>Vị trí</td><td colspan='3'><select id='cboTinhCong_ViTriLv'><option value='BA' selected>BA</option><option value='BA_'>BA_PartTime</option></select></td></tr><tr><td></td><td colspan='3'><input id='chkTinhCong_Edit' type='checkbox'/><label for='chkTinhCong_Edit'>Dùng dữ liệu Hiệu chỉnh</label></td></tr></table>",
			buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="DailyChamCongReport.runReport()">✔️ Report</button>'
		});
	},
	runReport:function(){
		if(num_Year.value&&num_Month.value){
			var vitrilv=cbo_ViTriLv.value;
			var nam=num_Year.value;
			var thang=num_Month.value;
			var date=nam+"-"+thang+"-15";
			DailyChamCongReport.url = NUT.services[2].url;
			NUT.ds.select({ url: DailyChamCongReport.url +"data/chucvuhabeco",where:[["machucvu","in","TF,TL,GDCN"],(n$.user.kvhcs.length?["makhuvuc","in",n$.user.kvhcs]:["thitruong","=",cbo_ThiTruong.value]),["or",["ngaybatdau","is","null"],["ngaybatdau","<=",date]],["or",["ngayketthuc","is","null"],["ngayketthuc",">=",date]]]},function(cvs){
				var lookupTL={},lookupTF={},gdcn=null;
				for(var i=0;i<cvs.length;i++){
					var cv=cvs[i];
					if(cv.machucvu=="TL")lookupTL[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="TF")lookupTF[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="GDCN")gdcn=cv.hoten;
				}
				NUT.ds.select({url:DailyChamCongReport.url+"rpt_dailycheckinout",where:[["nam","=",nam],["thang","=",thang],["madoitac","=","HABECO"],(n$.user.kvhcs.length?["makhuvuc","in",n$.user.kvhcs]:["thitruong","=",cbo_ThiTruong.value]),(vitrilv=="BA"?["vitrilv","=",vitrilv]:["vitrilv","like",vitrilv+"*"]),["dulieu","=",chk_Edit.checked?1:0]]},function(res){
					if(res.length){
						var win=window.open("client/"+n$.user.clientid+"/"+n$.curApp.applicationid+"/DailyChamCongReport.html");
						win.onload=function(){
							this.labGDCN.innerHTML=gdcn;
							this.labThangNam.innerHTML=thang+"/"+nam;
							this.labThiTruong.innerHTML=n$.user.kvhcs.length?n$.user.kvhcnames:cbo_ThiTruong.value;
							this.labNgayBaoCao.innerHTML=(new Date()).toLocaleString();
							var oldMaNhanVien=null;
							var oldMaDiemBan=null;
							var oldNgay=null;
							var row=null;
							var lookupCol={KL:3,KLO:4,N:5,NL:6,S:7,E:8};
							var sum=[0,0,0,0,0,0,0,0,0];
							var total=[];
							var grandTotal=[0,0,0,0,0,0,0,0,0];
							var stt=0, ngaycong=0;
							for(var i=0;i<res.length;i++){
								var rec=res[i];
								if(rec.manhanvien!=oldMaNhanVien||rec.madiemban!=oldMaDiemBan){
									if(row){
										for(var j=0;j<sum.length;j++){
											row.cells[43+j].innerHTML=sum[j];
											grandTotal[j]+=sum[j];
										}
									}
									row=this.tblData.insertRow();
									row.innerHTML="<td align='center'>"+(++stt)+"</td><td>"+rec.dms+"</td><td>"+rec.thitruong+"</td><td>"+(lookupTF[rec.makhuvuc]||lookupTL[rec.makhuvuc])+"</td><td class='frozen'>"+rec.hoten+"</td><td align='center'>"+rec.sohoso+"</td><td>"+rec.loaihinh+"</td><td class='frozen2'>"+rec.tendiemban+"</td><td>"+rec.sonha+"</td><td>"+rec.duong+"</td><td>"+rec.huyen+"</td><td>"+rec.tenkhuvuc+"</td>";
									for(var j=0;j<=40;j++)
										row.insertCell().align="center";
									oldMaNhanVien=rec.manhanvien;
									oldMaDiemBan=rec.madiemban;
									sum=[0,0,0,0,0,0,0,0,0];
								}
								if(rec.lan!=2)ngaycong=0;
								if(rec.ngay!=oldNgay){ngaycong=0;oldNgay=rec.ngay}
								if(rec.ngay){
									if(total[rec.ngay]==undefined)total[rec.ngay]=0;
									if(rec.ngaycong){
										ngaycong+=rec.ngaycong;
										row.cells[rec.ngay+11].innerHTML=ngaycong;
										sum[0]+=rec.ngaycong;
										sum[2]+=rec.ngaycong;
										total[rec.ngay]+=rec.ngaycong;
									}
									if(rec.chamcong){
										row.cells[rec.ngay+11].innerHTML=rec.chamcong;
										sum[lookupCol[rec.chamcong]]++;
									}
								}
							}
							if(row){
								for(var j=0;j<sum.length;j++){
									row.cells[43+j].innerHTML=sum[j];
									grandTotal[j]+=sum[j];
								}
							}
							row=this.tblData.insertRow();
							row.innerHTML="<td colspan='12' align='right'><b>Tổng cộng: </b></td>";
							for(var i=1;i<=31;i++){
								var cell=row.insertCell();
								cell.innerHTML="<b>"+(total[i]?total[i]:0)+"</b>";
							}
							for(var i=0;i<sum.length;i++){
								var cell=row.insertCell();
								cell.innerHTML="<b>"+(grandTotal[i]?grandTotal[i]:0)+"</b>";
							}
							row.insertCell();
						}
					} else NUT.tagMsg("No data to report!","yellow");
				});
			});
			
		} else NUT.tagMsg("Nhập năm, tháng trước khi thực hiện!","yellow");
	}
}