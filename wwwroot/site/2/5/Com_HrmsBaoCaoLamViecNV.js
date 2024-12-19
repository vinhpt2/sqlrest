var Com_HrmsBaoCaoLamViecNV={
	run:function(p){
		var self=this;

		var now=new Date();
		var nam=now.getFullYear();
		var thang=now.getMonth()+1;
		var ngay=now.getDate();
		var url=_context.service["hrms"].urledit;
		NUT_DS.select({url:url+"rpt_monthlysumNV",where:[["dulieu","=",0],["madoitac","=","HABECO"],["nam","=",nam],["thang","=",thang],["manhanvien","=","%22"+_context.user.username+"%22"]]},function(res){
			if(res.length){
				var rec=res[0];
				NUT_DS.select({url:url+"chitieu",where:[["madoitac","=","HABECO"],["nam","=",nam],["thang","=",thang],["manhanvien","=","%22"+_context.user.username+"%22"]]},function(cts){
					var ct=cts[0]||{bold:"-/-",light:"-/-",trucbach:"-/-",hanoipre:"-/-"};
					w2popup.open({
						title: '🚪 <i>Chấm công</i> - <b>#<i>'+nam+'-'+thang+'-'+ngay+'</i></b>',
						modal:true,
						width: 350,
						height: 400,
						body: '<table border="1px" cellspacing="0px" style="margin:auto;width:100%"><caption style="color:brown"><h2>Ngày công & Sản lượng</h2><b>Tháng '+thang+' Năm '+nam+'</b></caption><tr style="background:gold"><th>Ngày công</th><th colspan="2">Sản lượng</th><th>Khoán (két)</th></tr><tr><th rowspan="8"><h1 style="color:brown">'+rec.ngaycong+'</h1></th><td>Bold</td><th>'+rec.bold+'</th><th rowspan="2">'+ct.bold+'</th></tr><tr><td>Bold lon</td><th>'+rec.boldl+'</th></tr><tr><td>Light</td><th>'+rec.light+'</th><th rowspan="2">'+ct.light+'</th></tr><tr><td>Light lon</td><th>'+rec.lightl+'</th></tr><tr><td>TrucBach</td><th>'+rec.trucbach+'</th><th rowspan="2">'+ct.trucbach+'</th></tr><tr><td></td><th></th></tr><tr><td>HanoiPre</td><th>'+rec.hanoipre+'</th><th rowspan="2">'+ct.hanoipre+'</th></tr><tr><td></td><th></th></tr><tr></table>',
						buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button>'
					});
				});
			}else NUT.tagMsg("Không có dữ liệu Chấm công của"+_context.user.username,"yellow");
		});
			
	}
}