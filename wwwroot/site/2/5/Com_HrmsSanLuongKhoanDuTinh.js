var Com_HrmsSanLuongKhoanDuTinh={
	run:function(p,target){
		var self=this;
		self.urledit=_context.service["hrms"].urledit;
		var now=new Date();
		var nam=now.getFullYear();
		var thang=now.getMonth()+1;

		NUT_DS.select({url:self.urledit+"chitieu",where:[["manhanvien","=",_context.user.username],["nam","=",nam],["thang","=",thang]]},function(res){
			if(res.length){//da co chi tieu
				if(target){//not user click
					var rec=res[0];
					var sum=rec.bold+rec.light+rec.trucbach+rec.hanoipre+rec.b1890;
					w2alert("<table border='1px' cellspacing='0px' style='text-align:center;margin:auto'><caption style='color:brown'><b>"+_context.user.username+"<i> - Tháng "+rec.thang+"/"+rec.nam+"</i></b></caption><tr><td><b style='color:brown'>Tổng</b></td><td>Bold</td><td>Light</td><td>TrucBach</td><td>HanoiPre</td></tr><tr><td><b style='color:brown'>"+sum+"</b></td><td>"+rec.bold+"</td><td>"+rec.light+"</td><td>"+rec.trucbach+"</td><td>"+rec.hanoipre+"</td></tr></table>","Sản lượng khoán (két Dự tính)");
				}
			}else{
				w2popup.open({
					title: '🎯 - <i>Sản lượng khoán (két Dự tính)</i>',
					modal:true,
					showClose:false,
					width:400,
					height:250,
					body: '<h2>Nhập sản lượng khoán (két Dự tính)</h2><table border="1px" cellspacing="0px" style="margin:auto;width:100%;text-align:center"><caption style="background:pink"><b><i>'+_context.user.username+'</i> - Tháng '+(thang+'/'+nam)+'</b></caption><tr><td>Bold</td><td>Light</td><td>TrucBach</td><td>HanoiPre</td></tr><tr><td><input type="number" id="num_bold" style="width:50px"></td><td><input type="number" id="num_light" style="width:50px"></td><td><input type="number" id="num_trucbach" style="width:50px"></td><td><input type="number" id="num_hanoipre" style="width:50px"></td></tr></table>',
					buttons: '<button class="w2ui-btn" onclick="Com_HrmsSanLuongKhoanDuTinh.doKhoanSanLuong()">✔️ Ok</button>'
				});
			}
		});
	},
	doKhoanSanLuong:function(){
		var now=new Date();
		var data={madoitac:_context.user.ext,manhanvien:_context.user.username,nam:now.getFullYear(),thang:now.getMonth()+1};
		var sum=0;
		if(num_bold.value>0){data.bold=num_bold.value;sum+=parseInt(data.bold)}
		if(num_light.value>0){data.light=num_light.value;sum+=parseInt(data.light)}
		if(num_trucbach.value>0){data.trucbach=num_trucbach.value;sum+=parseInt(data.trucbach)}
		if(num_hanoipre.value>0){data.hanoipre=num_hanoipre.value;sum+=parseInt(data.hanoipre)}

		if(sum==0){
			NUT.tagMsg("Nhập số lượng Khoán sản lượng!","yellow",document.activeElement);
			return;
		}
		
		NUT_DS.insert({url:this.urledit+"chitieu",data:data},function(res){
			NUT.tagMsg("Khoán sản lượng inserted!","lime");
			w2popup.close()
		});
		
	}
}