using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.CodeDom;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics.Eventing.Reader;
using System.IO;
using System.Net;
using System.Security.Policy;
using System.Text.Json;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT + "file/{siteid}/{tableid}/{recid}")]
    public class FileController : ControllerBase
    {
        //select data in table
        [HttpPost]
        public async Task<ResponseJson> Upload(String siteid, String tableid, String recid)
        {
            try{
                var path = "wwwroot/file/" + siteid + "/" + tableid + "/" + recid+"/";
                if (!Directory.Exists(path)) Directory.CreateDirectory(path);
                var formData = await Request.ReadFormAsync();
                int i = 0;
                for (;i < formData.Files.Count; i++)
                {
                    var file = formData.Files[i];
                    var stream = new FileStream(path + file.Name, FileMode.OpenOrCreate);
                    formData.Files[i].CopyToAsync(stream);
                    stream.Close();
                }
                return new ResponseJson { success = true,result=path,total=i};
            } catch (Exception ex) {
                return new ResponseJson { success = false,result=ex.Message };
            }
        }
    }
}
