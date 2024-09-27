export class FieldImage extends w2field {
	constructor(options) {
		super("image", options);
		var self = this;
		this.form = w2ui["divform_" + options.conf.tabid];
		this.file = document.createElement("input");
		this.file.type = "file";
		this.image = document.createElement("img");
		this.image.className = "nut-fld-image";
		this.image.alt = "150x150-IMAGE";
		this.el.style.display = "none";
		this.el.parentNode.appendChild(this.image);
		this.image.onclick = function (evt) {
			self.file.click();
		}
		this.file.onchange = function (evt) {
			var reader = new FileReader();
			reader.readAsDataURL(this.files[0]);
			reader.onload = function () {
				self.image.src = this.result;
				//self.el.value=this.result;
				if (self.form.original == null) self.form.original = NUT.clone(self.form.record);
				self.form.record[self.el.name] = zipson.stringify(this.result);
				self.form.refresh(self.el.name);
			}
		}
		this.el.onchange = function (evt) {
			self.image.src = (evt instanceof Event) ? this.value : zipson.parse(evt);
		}
	}
});
