/* ---------------------------------------------------------------------- */
/* Script generated with: DeZign for Databases v6.2.1                     */
/* Target DBMS:           PostgreSQL 8.3                                  */
/* Project file:          Database.dez                                    */
/* Project name:                                                          */
/* Author:                                                                */
/* Script type:           Database creation script                        */
/* Created on:            2021-08-18 18:21                                */
/* ---------------------------------------------------------------------- */


/* ---------------------------------------------------------------------- */
/* Tables                                                                 */
/* ---------------------------------------------------------------------- */

/* ---------------------------------------------------------------------- */
/* Add table "NhanSu"                                                     */
/* ---------------------------------------------------------------------- */

CREATE TABLE NhanSu (
    MaNhanVien CHARACTER(10)   NOT NULL,
    HoTen TEXT ,
    ChieuCao INTEGER ,
    CanNang INTEGER ,
    NgaySinh DATE ,
    DienThoai TEXT ,
    Email TEXT ,
    DiaChiTT TEXT ,
    NoiO TEXT ,
    KinhNghiem TEXT ,
    NguonUngTuyen TEXT ,
    NgayPV DATE ,
    NguoiPV TEXT ,
    KeQuaPV SMALLINT ,
    GhiChuPV TEXT ,
    QuanLyTrucTiep TEXT ,
    SoCMT TEXT ,
    NgayCapCMT DATE ,
    NoiCapCMT TEXT ,
    MaSoThue TEXT ,
    HocVan SMALLINT ,
    SoTaiKhoan TEXT ,
    NganHang CHARACTER(5) ,
    ChiNhanhNH TEXT ,
    TinhTrangLV SMALLINT ,
    DiaDiemLV TEXT ,
    NgayBatDauLV DATE ,
    NgayNghiLV DATE ,
    LyDoNghiLV TEXT ,
    ViTriLV SMALLINT ,
    NgayBatDauTV DATE ,
    NgayKetThucTV DATE ,
    NgayKyHD DATE ,
    GhiChu TEXT ,
    NhanXet TEXT ,
    MaDoiTac CHARACTER(10) ,
    MaKhuVuc CHARACTER(10) ,
    CONSTRAINT PK_NhanSu PRIMARY KEY (MaNhanVien)
);

/* ---------------------------------------------------------------------- */
/* Add table "KhachHang"                                                  */
/* ---------------------------------------------------------------------- */

CREATE TABLE KhachHang (
    MaDoiTac CHARACTER(10)   NOT NULL,
    TenKhachHang TEXT ,
    DiaChi TEXT ,
    MaSoThue TEXT ,
    NguoiLienHe TEXT ,
    DienThoaiLH TEXT ,
    GhiChu TEXT ,
    CONSTRAINT PK_KhachHang PRIMARY KEY (MaDoiTac)
);

/* ---------------------------------------------------------------------- */
/* Add table "KhuVuc"                                                     */
/* ---------------------------------------------------------------------- */

CREATE TABLE KhuVuc (
    MaKhuVuc CHARACTER(10)   NOT NULL,
    TenKhuVuc TEXT ,
    ThiTruong SMALLINT ,
    CONSTRAINT PK_KhuVuc PRIMARY KEY (MaKhuVuc)
);

/* ---------------------------------------------------------------------- */
/* Add table "ChamCong"                                                   */
/* ---------------------------------------------------------------------- */

CREATE TABLE ChamCong (
    IdChamCong SERIAL   NOT NULL,
    NgayChamCong DATE ,
    ChamCong CHARACTER(3) ,
    MaNhanVien CHARACTER(10) ,
    CONSTRAINT PK_ChamCong PRIMARY KEY (IdChamCong)
);

/* ---------------------------------------------------------------------- */
/* Add table "SanLuong"                                                   */
/* ---------------------------------------------------------------------- */

CREATE TABLE SanLuong (
    IdSanLuong SERIAL   NOT NULL,
    MaSanPham CHARACTER(10) ,
    SoLuong INTEGER ,
    IdChamCong INTEGER ,
    MaNhanVien CHARACTER(10) ,
    CONSTRAINT PK_SanLuong PRIMARY KEY (IdSanLuong)
);

/* ---------------------------------------------------------------------- */
/* Add table "BangLuong"                                                  */
/* ---------------------------------------------------------------------- */

CREATE TABLE BangLuong (
    IdBangLuong SERIAL   NOT NULL,
    Nam INTEGER ,
    Thang INTEGER ,
    C1 CHARACTER(40) ,
    C2 CHARACTER(40) ,
    C3 CHARACTER(40) ,
    C4 CHARACTER(40) ,
    C5 CHARACTER(40) ,
    C6 CHARACTER(40) ,
    C7 CHARACTER(40) ,
    C8 CHARACTER(40) ,
    C9 CHARACTER(40) ,
    C10 CHARACTER(40) ,
    C11 CHARACTER(40) ,
    C12 CHARACTER(40) ,
    C13 CHARACTER(40) ,
    C14 CHARACTER(40) ,
    C15 CHARACTER(40) ,
    C16 CHARACTER(40) ,
    C17 CHARACTER(40) ,
    C18 CHARACTER(40) ,
    C19 CHARACTER(40) ,
    C20 CHARACTER(40) ,
    TongTien INTEGER ,
    DaThanhToan BOOLEAN ,
    GhiChu TEXT ,
    MaDoiTac CHARACTER(10) ,
    MaNhanVien CHARACTER(10) ,
    CONSTRAINT PK_BangLuong PRIMARY KEY (IdBangLuong)
);

/* ---------------------------------------------------------------------- */
/* Foreign key constraints                                                */
/* ---------------------------------------------------------------------- */

ALTER TABLE NhanSu ADD CONSTRAINT KhachHang_NhanSu 
    FOREIGN KEY (MaDoiTac) REFERENCES KhachHang (MaDoiTac);

ALTER TABLE NhanSu ADD CONSTRAINT KhuVuc_NhanSu 
    FOREIGN KEY (MaKhuVuc) REFERENCES KhuVuc (MaKhuVuc);

ALTER TABLE ChamCong ADD CONSTRAINT NhanSu_ChamCong 
    FOREIGN KEY (MaNhanVien) REFERENCES NhanSu (MaNhanVien);

ALTER TABLE SanLuong ADD CONSTRAINT ChamCong_SanLuong 
    FOREIGN KEY (IdChamCong) REFERENCES ChamCong (IdChamCong);

ALTER TABLE SanLuong ADD CONSTRAINT NhanSu_SanLuong 
    FOREIGN KEY (MaNhanVien) REFERENCES NhanSu (MaNhanVien);

ALTER TABLE BangLuong ADD CONSTRAINT KhachHang_BangLuong 
    FOREIGN KEY (MaDoiTac) REFERENCES KhachHang (MaDoiTac);

ALTER TABLE BangLuong ADD CONSTRAINT NhanSu_BangLuong 
    FOREIGN KEY (MaNhanVien) REFERENCES NhanSu (MaNhanVien);
