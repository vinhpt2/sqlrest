﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Data;
using System.Diagnostics.Eventing.Reader;
using System.Reflection;
using System.Text.Json;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT + "{database}/{schema}/data/{table}")]
    public class DataController : ControllerBase
    {
        //select data in table
        [HttpGet]
        public ResponseJson Select(String database, String schema, String table, String? select, String? where, String? groupby, String? having, String? orderby, int offset=0, int limit=0)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var from = " from " + database + "." + schema + "." + table;
                    var sql = "select " + (select==null?"*":select) + from;
                    String whereClause=null;
                    String siteid = null;
                    if (database == Global.database) siteid = Global.profiles[this.User.Identity.Name].siteid;
                    if (where != null && siteid != null)whereClause = " where siteid="+siteid+" and " + where;
                    else if(where != null) whereClause = " where " + where;
                    else if (siteid != null) whereClause = " where siteid=" + siteid;
                    if (whereClause != null) sql += whereClause;
                    if (groupby != null) sql += " group by " + groupby;
                    if (having != null) sql += " having " + having;
                    sql += " order by " + (orderby == null ? 1 : orderby);
                    sql += " offset " + offset + " rows ";
                    sql += " fetch next " + (limit == 0 ? Global.LIMIT : limit) + " rows only";

                    response.success = Global.safeSqlInjection(sql);
                    if (response.success)
                    {
                        if (limit != 0)
                        {
                            sql += ";select count(*)" + from;
                            if (whereClause != null) sql += whereClause;
                        }
                        using (var ds = db.ExecuteWithResults(sql))
                        {
                            var tbl = ds.Tables[0];
                                var rs = new Dictionary<String, Object>[tbl.Rows.Count];
                                for (int r = 0; r < rs.Length; r++)
                                {
                                    var row = tbl.Rows[r];
                                    var rec = new Dictionary<String, Object>();
                                    for (int c = 0; c < row.ItemArray.Length; c++)
                                    {
                                        rec.Add(tbl.Columns[c].ColumnName, row[c] is DBNull ? null : row[c]);
                                    }
                                    rs[r] = rec;
                                }
                                response.result = rs;
                                if (limit != 0) response.total = (int)ds.Tables[1].Rows[0][0];
                        }
                    }
                    else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //select data in table by id
        //table must have one column primary key
        [HttpGet("{id}")]
        public ResponseJson SelectById(String database, String schema, String table, String id, String? orderby)
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
                    TableViewBase tvb = (tb != null ? tb : db.Views[table, schema]);
                    response.success = (tvb != null);
                    if (response.success)
                    {
                        var index = tvb.Indexes[0];
                        response.success = (index != null && index.IndexKeyType == IndexKeyType.DriPrimaryKey);
                        if (response.success) {
                            var primaryKey = index.IndexedColumns[0].Name;
                            var sql = "select * from " + database + "." + schema + "." + table + " where " + primaryKey + " in(" + id + ")";
                            if (orderby != null) sql += " order by " + orderby;
                            response.success = Global.safeSqlInjection(sql);
                            if (response.success)
                            {
                                using (var ds = db.ExecuteWithResults(sql))
                                {
                                    var tbl = ds.Tables[0];
                                        var rs = new Dictionary<String, Object>[tbl.Rows.Count];
                                        for (int r = 0; r < rs.Length; r++)
                                        {
                                            var row = tbl.Rows[r];
                                            var rec = new Dictionary<String, Object>();
                                            for (int c = 0; c < row.ItemArray.Length; c++)
                                            {
                                                rec.Add(tbl.Columns[c].ColumnName, row[c]);
                                            }
                                            rs[r] = rec;
                                        }
                                        response.result = rs;
                                }
                            }
                            else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                        }
                        else response.result = "Table/View '" + database + "." + schema + "." + table + "' does not have primary key!";
                    }
                    else response.result = "Table/View '" + database + "." + schema + "." + table + "' not found!";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //insert data to table
        [HttpPost]
        public ResponseJson Insert(String database, String schema, String table, Dictionary<String, Object>[] data, bool returnid = false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var sqls = new String[data.Length];
                    for (var i = 0; i < data.Length; i++)
                    {
                        var rec = data[i];
                        var keyStr = String.Join(",", rec.Keys);
                        var values = rec.Values.ToArray();
                        for (int j = 0; j < values.Length; j++)
                        {
                            if (values[j] == null) values[j] = "null";
                            else
                            {
                                var val = (JsonElement)values[j];
                                if (val.ValueKind == JsonValueKind.String) values[j] = "N'" + val + "'";
                                else if (val.ValueKind == JsonValueKind.True) values[j] = 1;
                                else if (val.ValueKind == JsonValueKind.False) values[j] = 0;
                            }
                        }
                        var sqlStr = "insert into " + database + "." + schema + "." + table + "(" + keyStr + ") values(" + String.Join(",", values) + ")";
                        response.success = Global.safeSqlInjection(sqlStr);
                        if (!response.success) break;
                        sqls[i] = (returnid ? sqlStr + ";select scope_identity()" : sqlStr);
                    }
                    if (response.success)
                    {
                        var sql = String.Join(";", sqls);
                        if (returnid)
                            using (var ds = db.ExecuteWithResults(sql))
                            {
                                var newids = new object[ds.Tables.Count];
                                for (var i = 0; i < newids.Length; i++)
                                {
                                    newids[i] = ds.Tables[i].Rows[0][0];
                                }
                                response.result = newids;
                            }
                        else
                            db.ExecuteNonQuery(sql);
                    }
                    else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //update data in table
        [HttpPut]
        public ResponseJson Update(String database, String schema, String table, Dictionary<String, Object>[] data, String? where,String? key)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var sqls = new String[data.Length];
                    if (key == null)//update with where
                    {
                        response.success = (where != null);
                        if (response.success)
                        {
                            for (var i = 0; i < data.Length; i++)
                            {
                                var rec = data[i];
                                var keys = rec.Keys.ToArray();
                                var values = rec.Values.ToArray();
                                var clauses = new String[values.Length];
                                for (int j = 0; j < values.Length; j++)
                                {
                                    var k = keys[j];
                                    var value = values[j];
                                    String clause = null;
                                    if (value == null) clause = k + "=null";
                                    else
                                    {
                                        var val = (JsonElement)value;
                                        if (val.ValueKind == JsonValueKind.String) clause = k + "=N'" + val + "'";
                                        else if (val.ValueKind == JsonValueKind.True) clause = k + "=" + 1;
                                        else if (val.ValueKind == JsonValueKind.False) clause = k + "=" + 0;
                                        else clause = k + "=" + val;
                                    }
                                    clauses[j] = clause;
                                }
                                var sqlStr = "update " + database + "." + schema + "." + table + " set " + String.Join(",", clauses) + " where " + where;
                                response.success = Global.safeSqlInjection(sqlStr);
                                if (!response.success)
                                {
                                    response.result = "SQL INJECTION FOUND. Not safe to executes!";
                                    break;
                                }
                                sqls[i] = sqlStr;
                            }
                        }else response.result = "Update no where not allow!";
                    }
                    else
                    { //Update by key
                        for (var i = 0; i < data.Length; i++)
                        {
                            var rec = data[i];
                            var keys = rec.Keys.ToArray();
                            var values = rec.Values.ToArray();
                            var clauses = new String[values.Length - 1];
                            var count = 0;
                            where = null;
                            for (int j = 0; j < values.Length; j++)
                            {
                                var k = keys[j];
                                var value = values[j];
                                String clause = null;
                                if (value == null) clause = k + "=null";
                                else
                                {
                                    var val = (JsonElement)value;
                                    if (val.ValueKind == JsonValueKind.String) clause = k + "=N'" + val + "'";
                                    else if (val.ValueKind == JsonValueKind.True) clause = k + "=" + 1;
                                    else if (val.ValueKind == JsonValueKind.False) clause = k + "=" + 0;
                                    else clause = k + "=" + val;
                                }
                                if (key.Equals(k)) where = clause;
                                else clauses[count++] = clause;
                            }
                            response.success = (count == clauses.Length && where != null);
                            if (!response.success)
                            {
                                response.result = "Update no where not allow!";
                                break;
                            }
                            var sqlStr = "update " + database + "." + schema + "." + table + " set " + String.Join(",", clauses) + " where " + where;
                            response.success = Global.safeSqlInjection(sqlStr);
                            if (!response.success)
                            {
                                response.result = "SQL INJECTION FOUND. Not safe to executes!";
                                break;
                            }
                            sqls[i] = sqlStr;
                        }
                    }
                    if (response.success) db.ExecuteNonQuery(String.Join(";", sqls));
                }
                else response.result = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }
        
        //delete data in table
        [HttpDelete]
        public ResponseJson Delete(String database, String schema, String table, String where)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var sql = "delete " + database + "." + schema + "." + table + " where " + where;
                    response.success = Global.safeSqlInjection(sql);
                    if (response.success)
                    {
                        db.ExecuteNonQuery(sql);
                    }
                    else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
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
                            else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                        }
                        else response.result = "Table '" + database + "." + schema + "." + table + "' does not have primary key!";
                    }
                    else response.result = "Table '" + database + "." + schema + "." + table + "' not found!";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }
    }
}
