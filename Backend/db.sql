-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP TYPE public."peran_pengguna";

CREATE TYPE public."peran_pengguna" AS ENUM (
	'admin',
	'guru',
	'siswa');

-- DROP TYPE public."status_ujian";

CREATE TYPE public."status_ujian" AS ENUM (
	'berjalan',
	'selesai');
-- public.pengguna definition

-- Drop table

-- DROP TABLE public.pengguna;

CREATE TABLE public.pengguna (
	id_pengguna uuid DEFAULT uuid_generate_v4() NOT NULL,
	nama_pengguna varchar(50) NOT NULL,
	kata_sandi_hash text NOT NULL,
	peran public."peran_pengguna" NOT NULL,
	dibuat_pada timestamp DEFAULT now() NULL,
	email varchar(100) NULL,
	reset_token varchar(255) NULL,
	reset_token_expiry timestamp NULL,
	CONSTRAINT email_check CHECK ((((peran = ANY (ARRAY['admin'::peran_pengguna, 'guru'::peran_pengguna])) AND (email IS NOT NULL)) OR (peran = 'siswa'::peran_pengguna))),
	CONSTRAINT pengguna_email_key UNIQUE (email),
	CONSTRAINT pengguna_nama_pengguna_key UNIQUE (nama_pengguna),
	CONSTRAINT pengguna_pkey PRIMARY KEY (id_pengguna)
);

-- Permissions

ALTER TABLE public.pengguna OWNER TO postgres;
GRANT ALL ON TABLE public.pengguna TO postgres;


-- public.guru definition

-- Drop table

-- DROP TABLE public.guru;

CREATE TABLE public.guru (
	id_guru uuid NOT NULL,
	nip varchar(20) NOT NULL,
	nama_lengkap varchar(100) NOT NULL,
	CONSTRAINT guru_nip_key UNIQUE (nip),
	CONSTRAINT guru_pkey PRIMARY KEY (id_guru),
	CONSTRAINT guru_id_guru_fkey FOREIGN KEY (id_guru) REFERENCES public.pengguna(id_pengguna) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.guru OWNER TO postgres;
GRANT ALL ON TABLE public.guru TO postgres;


-- public.paket_ujian definition

-- Drop table

-- DROP TABLE public.paket_ujian;

CREATE TABLE public.paket_ujian (
	id_ujian uuid DEFAULT uuid_generate_v4() NOT NULL,
	dibuat_oleh uuid NULL,
	judul varchar(200) NOT NULL,
	kode_token varchar(6) NOT NULL,
	durasi_menit int4 NOT NULL,
	apakah_aktif bool DEFAULT false NULL,
	dibuat_pada timestamp DEFAULT now() NULL,
	CONSTRAINT paket_ujian_kode_token_key UNIQUE (kode_token),
	CONSTRAINT paket_ujian_pkey PRIMARY KEY (id_ujian),
	CONSTRAINT paket_ujian_dibuat_oleh_fkey FOREIGN KEY (dibuat_oleh) REFERENCES public.guru(id_guru)
);

-- Permissions

ALTER TABLE public.paket_ujian OWNER TO postgres;
GRANT ALL ON TABLE public.paket_ujian TO postgres;


-- public.siswa definition

-- Drop table

-- DROP TABLE public.siswa;

CREATE TABLE public.siswa (
	id_siswa uuid NOT NULL,
	nis varchar(20) NOT NULL,
	nama_lengkap varchar(100) NOT NULL,
	nama_kelas varchar(20) NOT NULL,
	id_perangkat varchar(100) NULL,
	CONSTRAINT siswa_nis_key UNIQUE (nis),
	CONSTRAINT siswa_pkey PRIMARY KEY (id_siswa),
	CONSTRAINT siswa_id_siswa_fkey FOREIGN KEY (id_siswa) REFERENCES public.pengguna(id_pengguna) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.siswa OWNER TO postgres;
GRANT ALL ON TABLE public.siswa TO postgres;


-- public.butir_soal definition

-- Drop table

-- DROP TABLE public.butir_soal;

CREATE TABLE public.butir_soal (
	id_soal uuid DEFAULT uuid_generate_v4() NOT NULL,
	id_ujian uuid NULL,
	teks_soal text NOT NULL,
	tipe_soal varchar(20) DEFAULT 'pilihan_ganda'::character varying NULL,
	opsi_jawaban jsonb NOT NULL,
	kunci_jawaban varchar(5) NULL,
	bobot_nilai int4 DEFAULT 1 NULL,
	CONSTRAINT butir_soal_pkey PRIMARY KEY (id_soal),
	CONSTRAINT butir_soal_id_ujian_fkey FOREIGN KEY (id_ujian) REFERENCES public.paket_ujian(id_ujian) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.butir_soal OWNER TO postgres;
GRANT ALL ON TABLE public.butir_soal TO postgres;


-- public.sesi_ujian definition

-- Drop table

-- DROP TABLE public.sesi_ujian;

CREATE TABLE public.sesi_ujian (
	id_sesi uuid DEFAULT uuid_generate_v4() NOT NULL,
	id_ujian uuid NULL,
	id_siswa uuid NOT NULL,
	waktu_mulai timestamp DEFAULT now() NULL,
	waktu_selesai timestamp NULL,
	status public."status_ujian" DEFAULT 'berjalan'::status_ujian NULL,
	nilai_akhir numeric(5, 2) DEFAULT 0 NULL,
	CONSTRAINT sesi_ujian_pkey PRIMARY KEY (id_sesi),
	CONSTRAINT sesi_ujian_id_siswa_fkey FOREIGN KEY (id_siswa) REFERENCES public.siswa(id_siswa),
	CONSTRAINT sesi_ujian_id_ujian_fkey FOREIGN KEY (id_ujian) REFERENCES public.paket_ujian(id_ujian)
);

-- Permissions

ALTER TABLE public.sesi_ujian OWNER TO postgres;
GRANT ALL ON TABLE public.sesi_ujian TO postgres;


-- public.jawaban_siswa definition

-- Drop table

-- DROP TABLE public.jawaban_siswa;

CREATE TABLE public.jawaban_siswa (
	id_jawaban uuid DEFAULT uuid_generate_v4() NOT NULL,
	id_sesi uuid NULL,
	id_soal uuid NULL,
	id_siswa uuid NOT NULL,
	opsi_dipilih varchar(5) NULL,
	waktu_klien timestamp NULL,
	sudah_sinkron bool DEFAULT true NULL,
	CONSTRAINT jawaban_siswa_id_sesi_id_soal_key UNIQUE (id_sesi, id_soal),
	CONSTRAINT jawaban_siswa_pkey PRIMARY KEY (id_jawaban),
	CONSTRAINT jawaban_siswa_id_sesi_fkey FOREIGN KEY (id_sesi) REFERENCES public.sesi_ujian(id_sesi) ON DELETE CASCADE,
	CONSTRAINT jawaban_siswa_id_siswa_fkey FOREIGN KEY (id_siswa) REFERENCES public.siswa(id_siswa),
	CONSTRAINT jawaban_siswa_id_soal_fkey FOREIGN KEY (id_soal) REFERENCES public.butir_soal(id_soal)
);

-- Permissions

ALTER TABLE public.jawaban_siswa OWNER TO postgres;
GRANT ALL ON TABLE public.jawaban_siswa TO postgres;


-- public.log_pelanggaran definition

-- Drop table

-- DROP TABLE public.log_pelanggaran;

CREATE TABLE public.log_pelanggaran (
	id_log uuid DEFAULT uuid_generate_v4() NOT NULL,
	id_sesi uuid NULL,
	id_siswa uuid NOT NULL,
	jenis_pelanggaran varchar(50) NOT NULL,
	waktu_kejadian timestamp DEFAULT now() NULL,
	CONSTRAINT log_pelanggaran_pkey PRIMARY KEY (id_log),
	CONSTRAINT log_pelanggaran_id_sesi_fkey FOREIGN KEY (id_sesi) REFERENCES public.sesi_ujian(id_sesi),
	CONSTRAINT log_pelanggaran_id_siswa_fkey FOREIGN KEY (id_siswa) REFERENCES public.siswa(id_siswa)
);

-- Permissions

ALTER TABLE public.log_pelanggaran OWNER TO postgres;
GRANT ALL ON TABLE public.log_pelanggaran TO postgres;



-- DROP FUNCTION public.id_pengguna_saat_ini();

CREATE OR REPLACE FUNCTION public.id_pengguna_saat_ini()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.id_pengguna_saat_ini() OWNER TO postgres;
GRANT ALL ON FUNCTION public.id_pengguna_saat_ini() TO postgres;

-- DROP FUNCTION public.uuid_generate_v1();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v1() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v1() TO postgres;

-- DROP FUNCTION public.uuid_generate_v1mc();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v1mc() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO postgres;

-- DROP FUNCTION public.uuid_generate_v3(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v3(uuid, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v3(uuid, text) TO postgres;

-- DROP FUNCTION public.uuid_generate_v4();

CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v4() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v4() TO postgres;

-- DROP FUNCTION public.uuid_generate_v5(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v5(uuid, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v5(uuid, text) TO postgres;

-- DROP FUNCTION public.uuid_nil();

CREATE OR REPLACE FUNCTION public.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$
;

-- Permissions

ALTER FUNCTION public.uuid_nil() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_nil() TO postgres;

-- DROP FUNCTION public.uuid_ns_dns();

CREATE OR REPLACE FUNCTION public.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_dns() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_dns() TO postgres;

-- DROP FUNCTION public.uuid_ns_oid();

CREATE OR REPLACE FUNCTION public.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_oid() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_oid() TO postgres;

-- DROP FUNCTION public.uuid_ns_url();

CREATE OR REPLACE FUNCTION public.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_url() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_url() TO postgres;

-- DROP FUNCTION public.uuid_ns_x500();

CREATE OR REPLACE FUNCTION public.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_x500() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_x500() TO postgres;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;