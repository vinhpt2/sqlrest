/* ---------------------------------------------------------------------- */
/* Script generated with: DeZign for Databases v6.2.1                     */
/* Target DBMS:           PostgreSQL 8.3                                  */
/* Project file:          Database.dez                                    */
/* Project name:                                                          */
/* Author:                                                                */
/* Script type:           Database drop script                            */
/* Created on:            2021-08-18 18:21                                */
/* ---------------------------------------------------------------------- */


/* ---------------------------------------------------------------------- */
/* Drop foreign key constraints                                           */
/* ---------------------------------------------------------------------- */

ALTER TABLE NhanSu DROP CONSTRAINT KhachHang_NhanSu;

ALTER TABLE NhanSu DROP CONSTRAINT KhuVuc_NhanSu;

ALTER TABLE ChamCong DROP CONSTRAINT NhanSu_ChamCong;

ALTER TABLE SanLuong DROP CONSTRAINT ChamCong_SanLuong;

ALTER TABLE SanLuong DROP CONSTRAINT NhanSu_SanLuong;

ALTER TABLE BangLuong DROP CONSTRAINT KhachHang_BangLuong;

ALTER TABLE BangLuong DROP CONSTRAINT NhanSu_BangLuong;

/* ---------------------------------------------------------------------- */
/* Drop table "BangLuong"                                                 */
/* ---------------------------------------------------------------------- */

/* Drop constraints */

ALTER TABLE BangLuong DROP CONSTRAINT PK_BangLuong;

/* Drop table */

DROP TABLE BangLuong;

/* ---------------------------------------------------------------------- */
/* Drop table "SanLuong"                                                  */
/* ---------------------------------------------------------------------- */

/* Drop constraints */

ALTER TABLE SanLuong DROP CONSTRAINT PK_SanLuong;

/* Drop table */

DROP TABLE SanLuong;

/* ---------------------------------------------------------------------- */
/* Drop table "ChamCong"                                                  */
/* ---------------------------------------------------------------------- */

/* Drop constraints */

ALTER TABLE ChamCong DROP CONSTRAINT PK_ChamCong;

/* Drop table */

DROP TABLE ChamCong;

/* ---------------------------------------------------------------------- */
/* Drop table "NhanSu"                                                    */
/* ---------------------------------------------------------------------- */

/* Drop constraints */

ALTER TABLE NhanSu DROP CONSTRAINT PK_NhanSu;

/* Drop table */

DROP TABLE NhanSu;

/* ---------------------------------------------------------------------- */
/* Drop table "KhuVuc"                                                    */
/* ---------------------------------------------------------------------- */

/* Drop constraints */

ALTER TABLE KhuVuc DROP CONSTRAINT PK_KhuVuc;

/* Drop table */

DROP TABLE KhuVuc;

/* ---------------------------------------------------------------------- */
/* Drop table "KhachHang"                                                 */
/* ---------------------------------------------------------------------- */

/* Drop constraints */

ALTER TABLE KhachHang DROP CONSTRAINT PK_KhachHang;

/* Drop table */

DROP TABLE KhachHang;
