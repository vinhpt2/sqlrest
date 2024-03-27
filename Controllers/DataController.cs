using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Text.Json;

namespace SQLRestC.Controllers
{
    [ApiController]
    [Route(Global.ROOT+"{database}/{schema}/data/{table}")]
    public class DataController : ControllerBase
    {
        //select data in table
        [HttpGet]
        public ResponseJson Select(String database, String schema, String table, String select="*", String where = null, String groupby = null, String having = null, String orderby = null, int offset = 0, int limit = 0)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server,Global.username,Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var sql = "select " + select + " from " + database + "." + schema + "." + table;
                    if(where !=null)sql+= " where " + where;
                    if (groupby != null) sql += " group by " + groupby;
                    if (having != null) sql += " having " + having;
                    sql += " order by " + (orderby ==null?1: orderby);
                    sql +=" offset " + offset + " rows ";
                    sql += " fetch next " + (limit == 0 ? Global.LIMIT : limit) + " rows only";
                    
                    response.success = Global.safeSqlInjection(sql);
                    if (response.success)
                    {
                        using (var ds = db.ExecuteWithResults(sql)) {
                            var tbl = ds.Tables[0];
                            if (tbl != null)
                            {
                                var rs = new Dictionary<String, Object>[tbl.Rows.Count];
                                for (int r = 0; r < tbl.Rows.Count; r++)
                                {
                                    var row = tbl.Rows[r];
                                    var rec = new Dictionary<String, Object>();
                                    for (int c = 0; c < row.ItemArray.Length; c++)
                                    {
                                        rec.Add(tbl.Columns[c].ColumnName, row[c] is DBNull ? null : row[c]);
                                    }
                                    rs[r] = rec;
                                }
                                response.results = rs;
                            }
                            else response.results = new object[0];//Empty
                        }
                    }
                    else response.results = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //select data in table by id
        //table must have one column primary key
        [HttpGet("{id}")]
        public ResponseJson SelectById(String database, String schema, String table, String id, String orderby=null)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = db.Tables[table, schema];
                    response.success = (tb != null);
                    if (response.success)
                    {
                        var index = tb.Indexes[0];
                        response.success = (index != null && index.IndexKeyType==IndexKeyType.DriPrimaryKey);
                        if (response.success) {
                            var primaryKey =index.IndexedColumns[0].Name;
                            var sql = "select * from "+database + "." + schema + "." + table + " where " + primaryKey + " in(" + id + ")";
                            if (orderby != null) sql += " order by " + orderby;
                            response.success = Global.safeSqlInjection(sql);
                            if (response.success)
                            {
                                using (var ds = db.ExecuteWithResults(sql))
                                {
                                    var tbl = ds.Tables[0];
                                    if (tbl != null)
                                    {
                                        var rs = new Dictionary<String, Object>[tbl.Rows.Count];
                                        for (int r = 0; r < tbl.Rows.Count; r++)
                                        {
                                            var row = tbl.Rows[r];
                                            var rec = new Dictionary<String, Object>();
                                            for (int c = 0; c < row.ItemArray.Length; c++)
                                            {
                                                rec.Add(tbl.Columns[c].ColumnName, row[c]);
                                            }
                                            rs[r] = rec;
                                        }
                                        response.results = rs;
                                    }
                                    else response.results = new object[0];//Empty
                                }
                            }
                            else response.results = "SQL INJECTION FOUND! Not safe to executes.";
                        }
                        else response.results = "Table '" + database + "." + schema + "." + table + "' does not have primary key!";
                    }
                    else response.results = "Table '" + database +"."+schema+"."+table + "' not found!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //insert data to table
        [HttpPost]
        public ResponseJson Insert(String database, String schema, String table, Dictionary<String,Object>[] records, bool returnId=false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    
                    var sqls = new String[records.Length];
                    for (var i = 0; i < records.Length; i++)
                    {
                        var rec = records[i];
                        var keyStr = String.Join(",", rec.Keys);
                        var values = rec.Values.ToArray();
                        for (int j = 0; j < values.Length; j++)
                        {
                            var val = (JsonElement)values[j];
                            if (val.ValueKind==JsonValueKind.String) values[j] = "N'" + val + "'";
                        }
                        var sqlStr = "insert into " + database + "." + schema + "." + table + "(" + keyStr + ") values(" + String.Join(",", values) + ")";
                        response.success = Global.safeSqlInjection(sqlStr);
                        if (!response.success) break;
                        sqls[i] = (returnId?sqlStr + ";select scope_identity()":sqlStr);
                    }
                    if (response.success)
                    {
                        var sql = String.Join(";", sqls);
                        if (returnId)
                            using (var ds = db.ExecuteWithResults(sql))
                            {
                                var newids = new object[ds.Tables.Count];
                                for (var i = 0; i < newids.Length; i++)
                                {
                                    newids[i] = ds.Tables[i].Rows[0][0];
                                }
                                response.results = newids;
                            }
                        else
                            db.ExecuteNonQuery(sql);
                    }
                    else response.results = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //update data in table
        [HttpPut]
        public ResponseJson Update(String database, String schema, String table, Dictionary<String, Object>[] records)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = db.Tables[table, schema];
                    response.success = (tb != null);
                    if (response.success)
                    {
                        var index = tb.Indexes[0];
                        response.success = (index != null && index.IndexKeyType == IndexKeyType.DriPrimaryKey);
                        if (response.success)
                        {
                            var primaryKey = index.IndexedColumns[0].Name;
                            var sqls = new String[records.Length];
                            for (var i = 0; i < records.Length; i++)
                            {
                                var rec = records[i];

                                response.success = rec.ContainsKey(primaryKey);
                                if (!response.success)
                                {
                                    response.results = "Record " + i + "th does NOT have primary key";
                                    break;
                                }
                                var primaryVal = (JsonElement)rec[primaryKey];
                                var keys = rec.Keys.ToArray();
                                var values = rec.Values.ToArray();
                                var clauses=new List<String>();
                                for (int j = 0; j < values.Length; j++)
                                {
                                    if (!primaryKey.Equals(keys[j]))
                                    {
                                        var val = (JsonElement)values[j];
                                        clauses.Add(val.ValueKind == JsonValueKind.String ? keys[j] + "=N'" + val + "'" : keys[j] + "=" + val);
                                    }
                                }
                                var sqlStr = "update " + database + "." + schema + "." + table + " set " + String.Join(",", clauses) + " where " + primaryKey + "=" + (primaryVal.ValueKind==JsonValueKind.String?"N'"+primaryVal+"'":primaryVal);
                                response.success = Global.safeSqlInjection(sqlStr);
                                if (!response.success)
                                {
                                    response.results = "SQL INJECTION FOUND in record "+i+"th. Not safe to executes.";
                                    break;
                                }
                                sqls[i] = sqlStr;
                            }
                            if (response.success)
                            {
                                db.ExecuteNonQuery(String.Join(";", sqls));
                            }
                        }
                        else response.results = "Table '" + database + "." + schema + "." + table + "' does not have primary key!";
                    }
                    else response.results = "Table '" + database + "." + schema + "." + table + "' not found!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }
        //delete data in table by id
        //table must have one column primary key
        [HttpDelete("{id}")]
        public ResponseJson DeleteById(String database, String schema, String table, String id)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = db.Tables[table, schema];
                    response.success = (tb != null);
                    if (response.success)
                    {
                        var index = tb.Indexes[0];
                        response.success = (index != null && index.IndexKeyType == IndexKeyType.DriPrimaryKey);
                        if (response.success)
                        {
                            var primaryKey = index.IndexedColumns[0].Name;
                            var sql = "delete " + database + "." + schema + "." + table + " where " + primaryKey + " in(" + id + ")";
                            response.success = Global.safeSqlInjection(sql);
                            if (response.success)
                            {
                                db.ExecuteNonQuery(sql);
                            }
                            else response.results = "SQL INJECTION FOUND! Not safe to executes.";
                        }
                        else response.results = "Table '" + database + "." + schema + "." + table + "' does not have primary key!";
                    }
                    else response.results = "Table '" + database + "." + schema + "." + table + "' not found!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }
    }
}
