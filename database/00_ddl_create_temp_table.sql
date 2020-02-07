create table tmp_datapatch_lcq (
    pk_license          int(11) primary key,
    ds_license_number   varchar(100),
    cd_state            varchar(10),
    id_profession       int(11),
    dt_added            timestamp default now()
);
