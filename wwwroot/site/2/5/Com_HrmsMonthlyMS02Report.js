var Com_HrmsMonthlyMS02Report={
	run:function(p){
		
		var now=new Date();
		w2popup.open({
			title: '📜 <i>Monthly MS02-Chấm công Report</i>',
			modal:true,
			width: 360,
			height: 220,
			body: "<table style='margin:auto'><tr><td>Năm</td><td><input id='numTinhCong_Year' style='width:60px' type='number' value='"+now.getFullYear()+"'/></td><td>Tháng</td><td><input id='numTinhCong_Month' style='width:60px' type='number' value='"+(now.getMonth()+1)+"'/></td></tr><tr><td>Đối tác</td><td>HABECO</td>"+(_context.user.kvhcs.length?"<td></td><td>":"<td>Thị trường</td><td><select id='cboTinhCong_ThiTruong'><option value='ĐBSH' selected>ĐBSH</option><option value='ĐTBB'>ĐTBB</option></select>")+"</td></tr><tr><td>Vị trí</td><td colspan='3'><select id='cboTinhCong_ViTriLv'><option value='BA' selected>BA</option><option value='BA_'>BA_PartTime</option><option value='SM'>SM</option></select></td></tr><tr><td></td><td colspan='3'><input id='chkTinhCong_Edit' type='checkbox'/><label for='chkTinhCong_Edit'>Dùng dữ liệu Hiệu chỉnh</label></td></tr></table>",
			buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="Com_HrmsMonthlyMS02Report.runReport()">✔️ Report</button>'
		})
	},
	runReport:function(){
		if(numTinhCong_Year.value&&numTinhCong_Month.value){
			var nam=numTinhCong_Year.value;
			var thang=numTinhCong_Month.value;
			var date=nam+"-"+thang+"-15";
			var url=_context.service["hrms"].urledit;
			NUT_DS.select({url:_context.service["hrms"].urledit+"chucvu_v",where:[["machucvu","in","TF,TL,GDCN"],(_context.user.kvhcs.length?["makhuvuc","in",_context.user.kvhcs]:["thitruong","=",cboTinhCong_ThiTruong.value]),["or",["ngaybatdau","is","null"],["ngaybatdau","<=",date]],["or",["ngayketthuc","is","null"],["ngayketthuc",">=",date]]]},function(cvs){
				var lookupTL={},lookupTF={},gdcn=null;
				for(var i=0;i<cvs.length;i++){
					var cv=cvs[i];
					if(cv.machucvu=="TL")lookupTL[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="TF")lookupTF[cv.makhuvuc]=cv.hoten;
					else if(cv.machucvu=="GDCN")gdcn=cv.hoten;
				}
				var vitrilv=cboTinhCong_ViTriLv.value;
				var isSM=(vitrilv=="SM");
				NUT_DS.select({url:_context.service["hrms"].urledit+"rpt_dailycheckinout",where:[["nam","=",nam],["thang","=",thang],["madoitac","=","HABECO"],(_context.user.kvhcs.length?["makhuvuc","in",_context.user.kvhcs]:["thitruong","=",cboTinhCong_ThiTruong.value]),(vitrilv=="SM"||vitrilv=="BA"?["vitrilv","=",vitrilv]:["vitrilv","like",vitrilv+"*"]),["dulieu","=",isSM?-1:(chkTinhCong_Edit.checked?1:0)]]},function(res){
					if(res.length){
						var win=window.open("client/"+_context.user.clientid+"/"+_context.curApp.applicationid+"/MonthlyMS02Report"+(isSM?"SM":"BA")+".html");
						win.onload=function(){
							this.labGDCN.innerHTML=gdcn;
							this.labThangNam.innerHTML="THÁNG "+thang+" NĂM "+nam;
							this.labThiTruong.innerHTML=_context.user.kvhcs.length?_context.user.kvhcnames:cboTinhCong_ThiTruong.value;
							this.labNgayBaoCao.innerHTML=(new Date()).toLocaleString();
							var oldMaNhanVien=null;
							var oldMaDiemBan=null;
							var row=null;
							var lookupCol={KL:3,KLO:4,N:5,NL:6,S:7,E:8};
							var sum=[0,0,0,0,0,0,0,0,0];
							var total=[];
							var grandTotal=[0,0,0,0,0,0,0,0,0];
							var stt=0,ngaycong=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
							for(var i=0;i<res.length;i++){
								var rec=res[i];
								if(rec.manhanvien!=oldMaNhanVien){
									if(row){
										for(var j=0;j<sum.length;j++){
											row.cells[(isSM?37:41)+j].innerHTML=sum[j];
											grandTotal[j]+=sum[j];
										}
									}
									row=this.tblData.insertRow();
									row.innerHTML="<td align='center'>"+(++stt)+"</td><td>"+(lookupTF[rec.makhuvuc]||lookupTL[rec.makhuvuc])+"</td><td class='frozen'>"+rec.hoten+"</td>"+(isSM?"<td align='center' class='frozen2'>"+rec.manhanvien+"</td><td>"+rec.kenhbanhang+"</td>":"<td align='center'>"+rec.sohoso+"</td><td>"+rec.loaihinh+"</td><td class='frozen2'>"+rec.tendiemban+"</td><td>"+rec.sonha+"</td><td>"+rec.duong+"</td><td>"+rec.huyen)+"</td><td>"+rec.tenkhuvuc+"</td>";
									for(var j=0;j<=41;j++)row.insertCell().align="center";
									oldMaNhanVien=rec.manhanvien;
									oldMaDiemBan=rec.madiemban;
									ngaycong=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
									sum=[0,0,0,0,0,0,0,0,0];
								}
								
								if(rec.ngay){
									if(total[rec.ngay]==undefined)total[rec.ngay]=0;
									if(rec.ngaycong){
										ngaycong[rec.ngay]+=rec.ngaycong;
										row.cells[rec.ngay+(isSM?5:9)].innerHTML=ngaycong[rec.ngay];
										sum[0]+=rec.ngaycong;
										sum[2]+=rec.ngaycong;
										total[rec.ngay]+=rec.ngaycong;
									}
									if(rec.chamcong){
										row.cells[rec.ngay+9].innerHTML=rec.chamcong;
										sum[lookupCol[rec.chamcong]]++;
									}
								}
								if(oldMaDiemBan!=rec.madiemban){
									row.cells[4].innerHTML+="<br/>"+rec.loaihinh;
									row.cells[5].innerHTML+="<br/>"+rec.tendiemban;
									row.cells[6].innerHTML+="<br/>"+rec.sonha;
									row.cells[7].innerHTML+="<br/>"+rec.duong;
									row.cells[8].innerHTML+="<br/>"+rec.huyen;
									oldMaDiemBan=rec.madiemban;
								}
							}
							if(row){
								for(var j=0;j<sum.length;j++){
									row.cells[(isSM?37:41)+j].innerHTML=sum[j];
									grandTotal[j]+=sum[j];
								}
							}
							row=this.tblData.insertRow();
							row.innerHTML="<td colspan='"+(isSM?6:10)+"' align='right'><b>Tổng cộng: </b></td>";
							for(var i=1;i<32;i++){
								var cell=row.insertCell();
								cell.innerHTML="<b>"+(total[i]?total[i]:0)+"</b>";
							}
							for(var i=0;i<sum.length;i++){
								var cell=row.insertCell();
								cell.innerHTML="<b>"+(grandTotal[i]?grandTotal[i]:0)+"</b>";
							}
							row.insertCell();row.insertCell();
						}
					} else NUT.tagMsg("No data to report!","yellow");
				});
			});
		} else NUT.tagMsg("Nhập năm, tháng trước khi thực hiện!","yellow");
	}
}