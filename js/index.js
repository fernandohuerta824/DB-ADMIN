import e from "express";
import express from "express";
import PG from "pg";
import {formatearFecha} from "./formatearfecha.js";

const app = express();
const port = 2313;

const pool = new PG.Pool ({
    user: "tuspelis_admin",
    host: "localhost",
    database: "tuspeliculasfavoritas",
    password: "badbunnyeselmejorcantante",
    port: 5432,
});

const errors = {
    status: true,
    message: "",
    place : "",
};

app.set("view engine", "ejs");

app.use(express.static("./"));
// Explicacion:
// Se en la ruta raiz en es donde esta el login, se valida el usuario y la contraseña  si la validacion es correcta se renderiza el index
// si no se renderiza el index con un mensaje de error

app.get("/", async (req, res) => {
    try {
        res.render("index");
    } catch (error) {
        res.status(500).send("Error del Servidor");
        console.error(error);
    }
}
);




app.get("/home", async (req, res) => {
    try {
        res.render("home");
    } catch (error) {
        res.status(500).send("Error del Servidor");
        console.error(error);
    }
});

app.get("/insertar", async (req, res) => {
    try {
        res.render("insertar");
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});



app.get("/datos_pelicula", async (req, res) => {
    try {
        
        res.render("datos_pelicula", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});


app.get("/insertar_pelicula", async (req, res) => {
    try {
        const data = req.query;
        console.log(data);
        const insert = await pool.query(
            `INSERT INTO pelicula (
                titulo_original
                ,fecha_estreno
                ,titulo_traducido
                ,lugar_estreno
                ,recaudacion_total
                ,categoria
                ,idioma_original
                ,image_url
                ,descripcion
                ,clasificacion
                ,rank
            )
            VALUES (
                $1
                ,$2
                ,$3
                ,$4
                ,$5
                ,$6
                ,$7
                ,$8
                ,$9 
                ,$10
                ,$11);`
           , [data.to,
              data.fe,
              data.tt,
              data.le,
              Number(data.rt),  
              data.c,
              data.io,
              data.img,
              data.d,
              data.cla,
              Number(data.r),  
           ]     
        );
        console.log(insert);
        errors.message = "Pelicula insertada correctamente";
        errors.place = "datos_pelicula";
        res.redirect("/datos_pelicula")
    } catch(error) {
        errors.status = true;
        console.log(error);
        errors.message = error.message;
        res.redirect(302,"/datos_pelicula")
    }
});

app.get("/datos_par_act_pelicula", async(req, res) => {
    try {

        res.render("datos_par_act_pelicula", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

app.get("/datos_par_act_pelicula2", async(req, res) => {
    try {
        const titulo = req.query.t;
        const result = await pool.query(
            `SELECT titulo_original, image_url, id_pelicula FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [titulo]
        );
        
        if(!result.rows[0]) {
    
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            errors.place = "datos_par_act_pelicula";
            res.redirect(302, "/datos_par_act_pelicula");
            return;
        }
        const movie = result.rows[0];
        
        res.render("datos_par_act_pelicula2", {movie});
    } catch(error) {
        errors.status = true;
        errors.message = error.message;
        errors.place = "datos_par_act_pelicula";
        res.redirect(302, "/datos_par_act_pelicula");
    }
});

app.get("/datos_par_act_pelicula3", async(req, res) => {
    try {
        const nombreActor = req.query.nombre;
        const movie = {
            id_pelicula: req.query.id_pelicula,
            titulo_original: req.query.titulo_original,
            image_url: req.query.image_url,
        };

        const resultParticipante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombreActor]
        );

        const participante = resultParticipante.rows[0];

        if(!participante) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "datos_par_act_pelicula";
            res.redirect(302, "/datos_par_act_pelicula");
            return;
        }

        const resultActor = await pool.query(
            `SELECT * FROM actor WHERE id_participante_cf = $1`
            , [Number(participante.id_participante)]
        );

        const actor = resultActor.rows[0];

        if(!actor) {
            errors.status = true;
            errors.message = "El participante no es un actor";
            errors.place = "datos_par_act_pelicula";
            res.redirect(302, "/datos_par_act_pelicula");
            return;
        }


        res.render("datos_par_act_pelicula3", {actor, movie});
    } catch(error) {
        errors.status = true;
        errors.message = error.message;
        errors.place = "datos_par_act_pelicula";
        res.redirect(302, "/datos_par_act_pelicula");
    }
});

app.get("/insertar_par_actor", async(req, res) => {
    try {
        const data = req.query;
        console.log(req.query);
        const insert = await pool.query(
            `INSERT INTO participacion_actor (
                id_pelicula_cf
                ,id_actor_cf
                ,rol
            )
            VALUES (
                $1
                ,$2
                ,$3
            );`
            , [Number(data.id_pelicula),
                Number(data.id_actor),
                data.rol
            ]
        );
        console.log(insert);
        errors.status = true;
        errors.message = "Participante insertado correctamente";
        errors.place = "datos_par_act_pelicula";
        res.redirect("/datos_par_act_pelicula");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "datos_par_act_pelicula";
        res.redirect(302, "/datos_par_act_pelicula");
    }
} );




app.get("/insertar_participante", async(req, res) => {
    try {
        const data = req.query;
        const insert = await pool.query(
            `INSERT INTO participante (
                nombre_artistico,
                nombre_real,
                fecha_nacimiento,
                estado,
                sexo,
                Image_url
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                );`,
            [data.nombre_artistico,
            data.nombre_real,
            data.fecha_nacimiento,
            data.estado,
            data.sexo,
            data.imagen_url]
        );
        errors.message = "Participante insertado correctamente";
        errors.place = "datos_participante";

        res.redirect("/datos_participante");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "datos_participante";
        res.redirect(302, "/datos_participante");
    }
} );

app.get("/datos_participante", async(req, res) => {
    try {
        
        res.render("datos_participante", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

app.get("/datos_actor", async(req, res) => {
    try {
        res.render("datos_actor", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});


app.get("/datos_actor2", async(req, res) => {
    try {
        const nombre = req.query.nombre;
        const result = await pool.query(
            `SELECT participante.nombre_real, participante.id_participante, image_url FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`,
            [nombre]
        );

        if(result.rows.length === 0) {
            errors.status = true;
            errors.message = "La persona no esta registrada como participante";
            errors.place = "datos_actor";
            res.redirect(302, "/datos_actor");
            return;
        }

        errors.status = false;
        const par = result.rows[0];
        res.render("datos_actor2", {par});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }

} );

app.get("/insertar_actor", async(req, res) => {
    try {
        const data = req.query;
        const fecha = await pool.query(
            `SELECT fecha_nacimiento FROM participante WHERE id_participante = $1`
            , [Number(data.id_participante)]
        );

        data.nacimiento = fecha.rows[0].fecha_nacimiento;

        const insert = await pool.query(
            `INSERT INTO actor (
                id_participante_cf,
                anio_debut,
                nombre_actor,
                Image_url,
                fecha_nacimiento,
                nacionalidad
                ) 
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                );`,
            [Number(data.id_participante),
                data.anio_debut,
                data.nombre_real,
                data.image_url,
                data.nacimiento,
                data.pais
            ]
        );
        errors.status = true;
        errors.message = "Actor insertado correctamente";
        errors.place = "datos_actor";
        res.redirect("/datos_actor");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/datos_actor");
    }
} );

app.get("/datos_par_dir_pelicula", async(req, res) => {
    try {
        res.render("datos_par_dir_pelicula", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

app.get("/datos_par_dir_pelicula2", async(req, res) => {

    try {
        const titulo = req.query.t;
        const result = await pool.query(
            `SELECT titulo_original, image_url, id_pelicula FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [titulo]
        );
        
        if(!result.rows[0]) {
    
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            errors.place = "datos_par_dir_pelicula";
            res.redirect(302, "/datos_par_dir_pelicula");
            return;
        }
        const movie = result.rows[0];
        res.render("datos_par_dir_pelicula2", {movie});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "datos_par_dir_pelicula";
        res.redirect(302, "/datos_par_dir_pelicula");
    }
} );

app.get("/insertar_dir_par", async(req, res) => {

    try {

        const data = req.query;

        //Verificar el participante existe

        const selectParticipante = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre]
        );

        const participante = selectParticipante.rows[0];

        if(!participante) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "datos_par_dir_pelicula";
            res.redirect(302, "/datos_par_dir_pelicula");
            return;
        }


        const selectDirector = await pool.query(
            `SELECT id_director FROM director WHERE id_participante_cf = $1`
            , [Number(participante.id_participante)]
        );

        if(selectDirector.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el director";
            errors.place = "datos_par_dir_pelicula";
            res.redirect(302, "/datos_par_dir_pelicula");
            return;
        }

        const insert = await pool.query(
            `INSERT INTO participacion_director (
                id_pelicula_cf,
                id_director_cf
            )
            VALUES (
                $1,
                $2
            );`,
            [Number(data.id_pelicula),
                selectDirector.rows[0].id_director
            ]
        );
        console.log(insert);
        errors.message = "Participanción insertada correctamente";
        errors.place = "datos_par_dir_pelicula";
        res.redirect("/datos_par_dir_pelicula");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "datos_par_dir_pelicula";
        console.log(error);
        res.redirect(302, "/datos_par_dir_pelicula");
    }
} );

//datos_gala

app.get("/datos_gala", async(req, res) => {
    try {
        res.render("datos_gala", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

app.get("/insertar_gala", async(req, res) => {
    try {
        const data = req.query;
        const insert = await pool.query(
            `INSERT INTO gala (
                nombre,
                organizador,
                categoria,
                lugar,
                anio_realizacion
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            );`, [data.nombre,
                data.organizador,
                data.categoria,
                data.lugar,
                Number(data.fecha)
            ]
        );

        errors.status = true;
        errors.message = "Gala insertada correctamente";
        errors.place = "datos_gala";
        res.redirect("/datos_gala");
    } catch(error) {
        errors.status = true;
        console.log(error);
        errors.message = error.detail;
        errors.place = "datos_gala";
        res.redirect(302, "/datos_gala");
    }
} );

//datos_nominaciones

app.get("/datos_nominaciones", async(req, res) => {
    try {
        res.render("datos_nominaciones", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

//datos_nominaciones2

app.get("/datos_nominaciones2", async(req, res) => {
    try {
        const nombre = req.query.nombre;
        const anio = req.query.anio;
        const result = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND 
            anio_realizacion = $2`
            , [nombre, Number(anio)]
        );

        if(result.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la gala";
            errors.place = "datos_nominaciones";
            res.redirect(302, "/datos_nominaciones");
            return;
        }

        const gala = result.rows[0];
        res.render("datos_nominaciones2", {gala, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/datos_nominaciones");
    }
} );

//insertar_nominacion

app.get("/insertar_nominacion", async(req, res) => {

    try {
        const tituloPelicula = req.query.pelicula;
        const result = await pool.query(
            `SELECT id_pelicula FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [tituloPelicula]
        );

        if(result.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            errors.place = "datos_nominaciones";
            res.redirect(302, "/datos_nominaciones");
            return;
        }

        const participante = req.query.participante;
        const result2 = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [participante]
        );

        

        if(result2.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "datos_nominaciones";
            res.redirect(302, "/datos_nominaciones");
            return;
        }

        
        let result3;
        let type;
        if(req.query.categoria === "Mejor Director" || req.query.categoria === "Mejor Pelicula") {
            result3 = await pool.query(
                `SELECT id_director FROM director WHERE id_participante_cf = $1`
                , [result2.rows[0].id_participante]
            );

            type = "director";
        } else {
            result3 = await pool.query(
                `SELECT id_actor FROM actor WHERE id_participante_cf = $1`
                , [result2.rows[0].id_participante]
            );

            type = "actor";
        }
        console.log(result3.rows);
        if(result3.rows.length === 0) {
            errors.status = true;
            errors.message = "El participante no es un " + type;
            errors.place = "datos_nominaciones";
            res.redirect(302, "/datos_nominaciones");
            return;
        }

        let result4;
        if(type === "director" ) {
            result4 = await pool.query(
                `SELECT * FROM participacion_director WHERE id_director_cf = $1 AND id_pelicula_cf = $2`
                , [result3.rows[0].id_director, result.rows[0].id_pelicula]
            );
        } else {
            result4 = await pool.query(
                `SELECT * FROM participacion_actor WHERE id_actor_cf = $1 AND id_pelicula_cf = $2`
                , [result3.rows[0].id_actor, result.rows[0].id_pelicula]
            );
        }

        if(result4.rows.length === 0) {
            errors.status = true;
            errors.message = "El " + type + " no participó en la pelicula";
            errors.place = "datos_nominaciones";
            res.redirect(302, "/datos_nominaciones");
            return;
        }


            


        const select = await pool.query(
            `SELECT id_nominacion FROM nominacion WHERE id_pelicula_cf = $1 AND id_participante_cf = $2 AND id_gala_cf = $3 AND categoria ILIKE $4`
            , [result.rows[0].id_pelicula,
                result2.rows[0].id_participante,
                Number(req.query.id_gala),
                req.query.categoria,
            ]
        );

        if(select.rows.length !== 0) {
            errors.status = true;
            errors.message = "La nominación ya existe";
            errors.place = "datos_nominaciones";
            res.redirect(302, "/datos_nominaciones");
            return;
        }
        const data = req.query;

        const insert = await pool.query(
            `INSERT INTO nominacion (
                id_gala_cf,
                id_pelicula_cf,
                id_participante_cf,
                categoria,
                nombre,
                ganado
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            );`, [Number(data.id_gala),
                result.rows[0].id_pelicula,
                result2.rows[0].id_participante,
                data.categoria,
                data.nombre,
                Number(data.ganado)

            ]
        );

        errors.status = true;
        errors.message = "Nominación insertada correctamente";
        errors.place = "datos_nominaciones";
        
        res.redirect("/datos_nominaciones");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "datos_nominaciones";
        console.log(error);
        res.redirect(302, "/datos_nominaciones");
    }
} );

//datos_tribunal

app.get("/datos_tribunal", async(req, res) => {
    try {
        res.render("datos_tribunal", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

//insertar_tribunal

app.get("/insertar_tribunal", async(req, res) => {
    try {
        const gala = {
            nombre: req.query.nombre_gala,
            anio: req.query.gala_anio,
        };

        const result = await pool.query(
            `SELECT id_gala FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [gala.nombre, Number(gala.anio)]
        );

        if(result.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la gala";
            errors.place = "datos_tribunal";
            res.redirect(302, "/datos_tribunal");
            return;
        }

        const participante = req.query.participante_nombre;

        const result2 = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [participante]
        );

        if(result2.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "datos_tribunal";
            res.redirect(302, "/datos_tribunal");
            return;
        }

        //Verifcar que el participante no este nominado en la gala

        const select = await pool.query(
            `SELECT id_nominacion FROM nominacion WHERE id_participante_cf = $1 AND id_gala_cf = $2`
            , [result2.rows[0].id_participante, Number(result.rows[0].id_gala)]
        );

        if(select.rows.length !== 0) {
            errors.status = true;
            errors.message = "El participante ya está nominado en la gala";
            errors.place = "datos_tribunal";
            res.redirect(302, "/datos_tribunal");
            return;
        }

        const rol = req.query.rol;
        const insert = await pool.query(
            `INSERT INTO tribunal (
                id_gala_cf,
                id_participante_cf,
                rol
            ) VALUES (
                $1,
                $2,
                $3
            );`, [Number(result.rows[0].id_gala),
                Number(result2.rows[0].id_participante),
                rol
            ]
        );
        console.log(insert);
        errors.status = true;
        errors.message = "Tribunal insertado correctamente";
        errors.place = "datos_tribunal";
        res.redirect("/datos_tribunal");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "datos_tribunal";
        res.redirect(302, "/datos_tribunal");
    }

} );

//modificar

app.get("/modificar", async(req, res) => {
    try {
        res.render("modificar", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

//modificar_pelicula

app.get("/modificar_pelicula", async(req, res) => {

    try {
        const titulo = req.query.nombre;
        const result = await pool.query(
            `SELECT * FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [titulo]
        );
        
        const movie = result.rows[0];

        
        res.render("modificar_pelicula", {movie, errors, formatearFecha});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
} );

app.get("/modificar_pelicula2", async(req, res) => {
    try {
        const data = {
            id_pelicula: req.query.id_pelicula,
            titulo_original: req.query.titulo_original,
            titulo_traducido: req.query.titulo_traducido,
            lugar_estreno: req.query.lugar_estreno,
            recaudacion_total: req.query.recaudacion_total,
            categoria: req.query.categoria,
            idioma_original: req.query.idioma_original,
            image_url: req.query.imagen_url,
            descripcion: req.query.descripcion,
            clasificacion: req.query.clasificacion,
            rank: req.query.rank,

        };
        console.log(req.query);
        if (!data.fecha_estreno) {
            data.fecha_estreno = req.query.fecha_estreno;
        }
        console.log(data);
        let update;
        if(data.fecha_estreno) {
            
            update = await pool.query(
                `UPDATE pelicula SET
                titulo_original = $1,
                fecha_estreno = $2,
                titulo_traducido = $3,
                lugar_estreno = $4,
                recaudacion_total = $5,
                categoria = $6,
                idioma_original = $7,
                image_url = $8,
                descripcion = $9,
                clasificacion = $10,
                rank = $11
                WHERE id_pelicula = $12;`
                , [data.titulo_original,
                    data.fecha_estreno,
                    data.titulo_traducido,
                    data.lugar_estreno,
                    Number(data.recaudacion_total),
                    data.categoria,
                    data.idioma_original,
                    data.image_url,
                    data.descripcion,
                    data.clasificacion,
                    Number(data.rank),
                    Number(data.id_pelicula)
                ]
            );
        
        } else {
            update = await pool.query(
                `UPDATE pelicula SET
                titulo_original = $1,
                titulo_traducido = $2,
                lugar_estreno = $3,
                recaudacion_total = $4,
                categoria = $5,
                idioma_original = $6,
                image_url = $7,
                descripcion = $8,
                clasificacion = $9,
                rank = $10
                WHERE id_pelicula = $11;`
                , [data.titulo_original,
                    data.titulo_traducido,
                    data.lugar_estreno,
                    Number(data.recaudacion_total),
                    data.categoria,
                    data.idioma_original,
                    data.image_url,
                    data.descripcion,
                    data.clasificacion,
                    Number(data.rank),
                    Number(data.id_pelicula)
                ]
            );
        }
                
        console.log(update);
        errors.status = true;
        errors.message = "Pelicula modificada correctamente";
        errors.place = "modificar_pelicula";
        res.redirect("/modificar_pelicula");
    } catch(error) {
        console.log(error);
        errors.status = true;
        errors.message = error.detail;
        errors.place = "modificar_pelicula";
        res.redirect(302, "/modificar_pelicula");
    }
} );

//modificar_participante

app.get("/modificar_participante", async(req, res) => {

    try {
        const nombre = req.query.nombre;
        const result = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombre]
        );
        
        const participante = result.rows[0];
        res.render("modificar_participante", {participante, errors, formatearFecha});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/modificar");
    }
});

app.get("/modificar_participante2", async(req, res) => {

    try {
        const data = {
            id_participante: req.query.id_participante,
            nombre_artistico: req.query.nombre_artistico,
            nombre_real: req.query.nombre_real,
            estado: req.query.estado,
            sexo: req.query.sexo,
            image_url: req.query.image_url,
        };

        if(!data.fecha_nacimiento) {
            data.fecha_nacimiento = req.query.fecha_nacimiento;
        }
        
        

        let updateParticipante;
        let updateActor;
        let updateDirector;
        if(data.fecha_nacimiento) {
            updateParticipante = await pool.query(
                `UPDATE participante SET
                nombre_artistico = $1,
                nombre_real = $2,
                fecha_nacimiento = $3,
                estado = $4,
                sexo = $5,
                image_url = $6
                WHERE id_participante = $7;`
                , [data.nombre_artistico,
                    data.nombre_real,
                    data.fecha_nacimiento,
                    data.estado,
                    data.sexo,
                    data.image_url,
                    Number(data.id_participante)
                ]
            );

            updateActor = await pool.query(
                `UPDATE actor SET
                nombre_actor = $1,
                image_url = $2,
                fecha_nacimiento = $3
            WHERE id_participante_cf = $4;`
            , [data.nombre_real,
                data.image_url,
                data.fecha_nacimiento,
                Number(data.id_participante)
            ]
            );

            updateDirector = await pool.query(
                `UPDATE director SET
                nombre = $1,
                image_url = $2,
                nacimiento = $3
             WHERE id_participante_cf = $4;`
            , [data.nombre_real,
                data.image_url,
                data.fecha_nacimiento,
                Number(data.id_participante)
            ]
            );

        } else {
            updateParticipante = await pool.query(
                `UPDATE participante SET
                nombre_artistico = $1,
                nombre_real = $2,
                estado = $3,
                sexo = $4,
                image_url = $5
                WHERE id_participante = $6;`
                , [data.nombre_artistico,
                    data.nombre_real,
                    data.estado,
                    data.sexo,
                    data.image_url,
                    Number(data.id_participante)
                ]
                
            );

            updateActor = await pool.query(
                `UPDATE actor SET
                nombre_actor = $1,
                image_url = $2
                WHERE id_participante_cf = $3;`
                , [data.nombre_real,
                    data.image_url,
                    Number(data.id_participante)
                ]
            );

            updateDirector = await pool.query(
                `UPDATE director SET
                nombre_director = $1,
                image_url = $2
                WHERE id_participante_cf = $3;`
                , [data.nombre_real,
                    data.image_url,
                    Number(data.id_participante)
                ]
            );

        }
        console.log(updateActor);
        console.log(updateParticipante);
        console.log(updateDirector);

        errors.status = true;
        errors.message = "Participante modificado correctamente";
        errors.place = "modificar_participante";
        res.redirect("/modificar_participante");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "modificar_participante";
        console.log(error);
        res.redirect(302, "/modificar_participante");
    }
} );

//modificar_actor

app.get("/modificar_actor", async(req, res) => {

    try {
        const nombre = req.query.nombre;
        console.log(nombre);
        const resultParticipante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombre]
        );

        

        let result;
        let actor;
        if(resultParticipante.rows.length !== 0) {
            result = await pool.query(
                `SELECT * FROM actor WHERE id_participante_cf = $1`
                , [Number(resultParticipante.rows[0].id_participante)]
            );
            actor = result.rows[0];
        }  else 
            actor = undefined;

        
        
        
        
        res.render("modificar_actor", {actor, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/modificar");
    }
} );

app.get("/modificar_actor2", async(req, res) => {

    try {
        const data = {
            id_actor: req.query.id_actor,
            anio_debut: req.query.anio_debut,
            nacionalidad: req.query.nacionalidad,
        };

        console.log(data);
        console.log(req.query);


        const update = await pool.query(
            `UPDATE actor SET
            anio_debut = $1,
            nacionalidad = $2
            WHERE id_actor = $3;`
            , [data.anio_debut,
                data.nacionalidad,
                Number(data.id_actor)
            ]
        );


        console.log(update);
        errors.status = true;
        errors.message = "Actor modificado correctamente";
        errors.place = "modificar_actor";
        res.redirect("/modificar_actor");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/modificar_actor");
    }
} );

//modificar_par_act

app.get("/modificar_par_act", async(req, res) => {

    try {
        const nombreActor = req.query.nombre_actor;
        const nombrePelicula = req.query.nombre_pelicula;

        console.log(req.query);

        const resultParticipante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombreActor]
        );


        let resultActor;
        let actor;
        if(resultParticipante.rows.length !== 0) {
            resultActor = await pool.query(
                `SELECT * FROM actor WHERE id_participante_cf = $1`
                , [Number(resultParticipante.rows[0].id_participante)]
            );
            actor = resultActor.rows[0];
        } else {
            actor = undefined;
        }

        ;

        const resultPelicula = await pool.query(
            `SELECT * FROM pelicula WHERE titulo_original ILIKE $1`
            , [nombrePelicula]
        );

        
        const pelicula = resultPelicula.rows[0];
        let resultParticipacion;
        let participacion_actor;

        console.log(!actor || !pelicula);
        if(!actor || !pelicula) {
            resultParticipacion = participacion_actor = undefined;
        } else {
            resultParticipacion = await pool.query(
                `SELECT * FROM participacion_actor WHERE id_pelicula_cf = $1 AND id_actor_cf = $2`
                , [Number(pelicula.id_pelicula), Number(actor.id_actor)]
            );
            participacion_actor = resultParticipacion.rows[0];
        }
        console.log(actor);
        res.render("modificar_par_act", {actor, pelicula, participacion_actor, errors});
    } catch(error) {
        errors.status = true;
        console.log(error);
        errors.message = error.detail;
        res.redirect(302, "/modificar");
    }
} );

app.get("/modificar_par_act2", async(req, res) => {

    try {
        const data = {
            id_participacion_actor: req.query.id_participacion_actor,
            id_actor: req.query.id_actor,
            rol: req.query.rol,
        };  
        
        const pelicula = req.query.pelicula;
        
        const result = await pool.query(
            `SELECT id_pelicula FROM pelicula WHERE titulo_original ILIKE $1`
            , [pelicula]
        );

        if(result.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            res.redirect(302, "/modificar_par_act");
            return;
        }

        data.id_pelicula = result.rows[0].id_pelicula;
        console.log(data);
        const update = await pool.query(
            `UPDATE participacion_actor SET
                id_participacion_actor = $1,
                id_pelicula_cf = $2,
                id_actor_cf = $3,
                rol = $4
                WHERE id_participacion_actor = $5;`
                , [Number(data.id_participacion_actor),
                    Number(data.id_pelicula),
                    Number(data.id_actor),
                    data.rol,
                    Number(data.id_participacion_actor)
                ]
        );

        console.log(update);
        errors.status = true;
        errors.message = "Participación modificada correctamente";
        errors.place = "modificar_par_act";
        res.redirect("/modificar_par_act");
    } catch(error) {
        errors.status = true;
        console.log(error);
        errors.message = error.detail;
        errors.place = "modificar_par_act";
        res.redirect(302, "/modificar_par_act");
    }
} );

//modificar_gala

app.get("/modificar_gala", async(req, res) => {

    try {
        const data = req.query;
        data.anio_realizacion = data.anio_realizacion || 0;

        const result = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [data.nombre, Number(data.anio_realizacion)]
        );

        const gala = result.rows[0];

        res.render("modificar_gala", {gala, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/modificar_gala");
    }

} );

app.get("/modificar_gala2", async(req, res) => {
    try {
        const data = req.query;
        console.log(data);
        const update = await pool.query(
            `UPDATE gala SET
            nombre = $1,
            organizador = $2,
            categoria = $3,
            lugar = $4,
            anio_realizacion = $5
            WHERE id_gala = $6;`
            , [data.nombre,
                data.organizador,
                data.categoria,
                data.lugar,
                Number(data.fecha),
                Number(data.id_gala)
            ]
        );

        console.log(update);
        errors.status = true;
        errors.message = "Gala modificada correctamente";
        errors.place = "modificar_gala";

        res.redirect("/modificar_gala");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "modificar_gala";
        res.redirect(302, "/modificar_gala");
    }
} );

//modificar_nominacion

app.get("/modificar_nominacion", async(req, res) => {

    try {
        const data = req.query;

        data.nombre = data.nombre || "";
        data.anio_realizacion = data.anio_realizacion || 0;

        const result = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [data.nombre, Number(data.anio_realizacion)]
        );

        const gala = result.rows[0];
        
        res.render("modificar_nominacion", {gala, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/modificar");
    }
} );

app.get("/modificar_nominacion2", async(req, res) => {
    try {
        const data = req.query;
        console.log(data);
        const resultPelicula = await pool.query(
            `SELECT titulo_original, image_url, id_pelicula FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [data.pelicula]
        );

        const pelicula = resultPelicula.rows[0];

        if(resultPelicula.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        const resultParticipante = await pool.query(

            `SELECT nombre_real, id_participante, image_url FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.ganador]
        );

        const participante = resultParticipante.rows[0];

        if(resultParticipante.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }




        const resultGala = await pool.query(
            `SELECT id_gala, anio_realizacion, nombre FROM gala WHERE id_gala = $1`
            , [Number(data.id_gala)]
        );

        const gala = resultGala.rows[0];


        

        const resultNominacion = await pool.query(
            `SELECT * FROM nominacion WHERE categoria ILIKE $1 AND id_pelicula_cf = $2 AND id_participante_cf = $3 AND id_gala_cf = $4` 
            , [data.categoria, Number(pelicula.id_pelicula), Number(participante.id_participante), Number(gala.id_gala)]
        );

        if(resultNominacion.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la nominación";
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        
        const nominacion = resultNominacion.rows[0];

        res.render("modificar_nominacion2", {nominacion, pelicula, participante, gala,  errors});


    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "modificar_nominacion";
        res.redirect(302, "/modificar_nominacion");
    }
} );

app.get("/modificar_nominacion3", async(req, res) => {

    try {
        const data = req.query;
        const resultPelicula = await pool.query(
            `SELECT id_pelicula FROM pelicula WHERE titulo_original ILIKE $1`
            , [data.pelicula]
        );
        
        if(resultPelicula.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        const resultParticipante = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.ganador]
        );

        if(resultParticipante.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        let resultParticipacion;
        let type;
        if(data.categoria === "Mejor Director" || data.categoria === "Mejor Pelicula") {

            resultParticipacion = await pool.query(
                `SELECT id_director FROM director WHERE id_participante_cf = $1`
                , [resultParticipante.rows[0].id_participante]
            );

            

            type = "director";
        } else {
            resultParticipacion = await pool.query(
                `SELECT id_actor FROM actor WHERE id_participante_cf = $1`
                , [resultParticipante.rows[0].id_participante]
            );

            

            type = "actor";
        }

        if(resultParticipacion.rows.length === 0) {
            errors.status = true;
            errors.message = "El participante no es un " + type;
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        let resultParticipacion2;
        if(type === "director") {
            resultParticipacion2 = await pool.query(
                `SELECT * FROM participacion_director WHERE id_director_cf = $1 AND id_pelicula_cf = $2`
                , [resultParticipacion.rows[0].id_director, resultPelicula.rows[0].id_pelicula]
            );

        } else {
            resultParticipacion2 = await pool.query(
                `SELECT * FROM participacion_actor WHERE id_actor_cf = $1 AND id_pelicula_cf = $2`
                , [resultParticipacion.rows[0].id_actor, resultPelicula.rows[0].id_pelicula]
            );
        }

        if(resultParticipacion2.rows.length === 0) {
            errors.status = true;
            errors.message = "El " + type + " no participó en la pelicula";
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        

        //Validar que la nominacion no exista
        const select = await pool.query(
            `SELECT id_nominacion FROM nominacion WHERE id_pelicula_cf = $1 AND id_participante_cf = $2 AND id_gala_cf = $3 AND categoria ILIKE $4 AND ganado = $5`
            , [resultPelicula.rows[0].id_pelicula,
                resultParticipante.rows[0].id_participante,
                Number(data.id_gala),
                data.categoria,
                Number(data.ganado)
            ]
        );

        if(select.rows.length !== 0) {
            errors.status = true;
            errors.message = "La nominación ya existe";
            errors.place = "modificar_nominacion";
            res.redirect(302, "/modificar_nominacion");
            return;
        }

        

        const update = await pool.query(
            `UPDATE nominacion SET
                nombre = $1,
                categoria = $2,
                ganado = $3,
                id_pelicula_cf = $4,
                id_participante_cf = $5,
                id_gala_cf = $6
            WHERE id_nominacion = $7;`
            , [data.nombre,
                data.categoria,
                Number(data.ganado),
                resultPelicula.rows[0].id_pelicula,
                resultParticipante.rows[0].id_participante,
                Number(data.id_gala),
                Number(data.id_nominacion)
            ]
        );

        console.log(update);
        errors.message = "Se modificó la nominación correctamente";
        errors.place = "modificar_nominacion";
        res.redirect("/modificar_nominacion");

    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/modificar_nominacion");
    }
} );

//modificar_tribunal

app.get("/modificar_tribunal", async(req, res) => {

    try {
        const data = req.query;
        data.anio_realizacion = data.anio_realizacion || 0;

        const result = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [data.nombre, Number(data.anio_realizacion)]
        );

        const gala = result.rows[0];
        if(gala) {
            errors.status = false;
        } 
        res.render("modificar_tribunal", {gala, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/modificar_tribunal");
    }
} );

app.get("/modificar_tribunal2", async(req, res) => {

    try {
        const data = req.query;

        const resultParticipante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE
            $1 OR nombre_artistico ILIKE $1`
            , [data.participante]
        );
        
        if(resultParticipante.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "modificar_tribunal";
            res.redirect(302, "/modificar_tribunal");
            return;
        }

        const resultGala = await pool.query(
            `SELECT * FROM gala WHERE id_gala = $1`
            , [Number(data.id_gala)]
        );

        if(resultGala.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la gala";
            errors.place = "modificar_tribunal";
            res.redirect(302, "/modificar_tribunal");
            return;
        }

        const resultTribunal = await pool.query(
            `SELECT * FROM tribunal WHERE id_gala_cf = $1 AND id_participante_cf = $2`
            , [Number(data.id_gala), resultParticipante.rows[0].id_participante]
        );

        if(resultTribunal.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el tribunal";
            errors.place = "modificar_tribunal";
            res.redirect(302, "/modificar_tribunal");
            return;
        }
        console.log(resultParticipante.rows[0]);
        const tribunal = resultTribunal.rows[0];
        res.render("modificar_tribunal2", {tribunal, gala: resultGala.rows[0], errors, participante: resultParticipante.rows[0]});

    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "modificar_tribunal";
        console.log(error);
        res.redirect(302, "/modificar_tribunal");
    }
} );

app.get("/modificar_tribunal3", async(req, res) => {
    try {
        const data = req.query;
        const resultParticipacion = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre]
        );
        console.log(resultParticipacion);
        if(resultParticipacion.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "modificar_tribunal";
            res.redirect(302, "/modificar_tribunal");
            return;
        }

        const resultNominacion = await pool.query(
            `SELECT id_nominacion FROM nominacion WHERE id_participante_cf = $1 AND id_gala_cf = $2`
            , [resultParticipacion.rows[0].id_participante, Number(data.id_gala)]
        );

        if(resultNominacion.rows.length !== 0) {
            errors.status = true;
            errors.message = "El participante está nominado en la gala";
            errors.place = "modificar_tribunal";
            res.redirect(302, "/modificar_tribunal");
            return;
        }

        const update = await pool.query(
            `UPDATE tribunal SET
                rol = $1,
                id_participante_cf = $2
                WHERE id_gala_cf = $3;`
            , [data.rol, resultParticipacion.rows[0].id_participante, Number(data.id_gala)]
        );

        console.log(update);
        errors.message = "Se modificó el tribunal correctamente";
        errors.place = "modificar_tribunal";
        res.redirect("/modificar_tribunal");

    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "modificar_tribunal";
        console.log(error);
        res.redirect(302, "/modificar_tribunal");
    }
} );

//eliminar

app.get("/eliminar", async(req, res) => {
    try {
        res.render("eliminar", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
});

// eliminar_pelicula

app.get("/eliminar_pelicula", async(req, res) => {

    try {
        const titulo = req.query.nombre;
        const result = await pool.query(
            `SELECT * FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [titulo]
        );
        
        const pelicula = result.rows[0];
        res.render("eliminar_pelicula", {pelicula, errors});
    }
    catch(error) {
        errors.status = true;
        errors.message = error.detail;
        error.place = "eliminar";
        console.log(error);
        res.redirect(302, "/eliminar");
    }
} );


app.get("/eliminar_pelicula2", async(req, res) => {
    try {
        const data = req.query;
        const result = await pool.query(
            `DELETE FROM pelicula WHERE id_pelicula = $1`
            , [Number(data.id_pelicula)]
        );

        errors.message = "Se eliminó la película correctamente";
        errors.place = "eliminar_pelicula";
        res.redirect("/eliminar_pelicula");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_pelicula";
        res.redirect(302, "/eliminar_pelicula");
    }
} );

//eliminar_participante

app.get("/eliminar_participante", async(req, res) => {
    
        try {
            const nombre = req.query.nombre;

            const result = await pool.query(
                `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
                , [nombre]
            );
            const participante = result.rows[0];


            res.render("eliminar_participante", {participante, errors});
        }
        catch(error) {
            errors.status = true;
            errors.message = error.detail;
            res.redirect(302, "/eliminar");
        }
    } );


app.get("/eliminar_participante2", async(req, res) => {
    try {
        const data = req.query;

        const result = await pool.query(
            `DELETE FROM participante WHERE id_participante = $1`
            , [Number(data.id_participante)]
        );

        errors.message = "Se eliminó el participante correctamente";
        errors.place = "eliminar_participante";
        res.redirect("/eliminar_participante");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_participante";
        res.redirect(302, "/eliminar_participante");
    }
} );


//eliminar_actor

app.get("/eliminar_actor", async(req, res) => {

    try {
        const nombre = req.query.nombre;

        const participante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombre]
        );

        let result;
        let actor;

        if(participante.rows.length !== 0) {
            result = await pool.query(
                `SELECT * FROM actor WHERE id_participante_cf = $1`
                , [Number(participante.rows[0].id_participante)]
            );
            actor = result.rows[0];
        } else {
            actor = undefined;
        }


        res.render("eliminar_actor", {actor, errors});
    }
    catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/eliminar");
    }
} );

app.get("/eliminar_actor2", async(req, res) => {

    try {
        const data = req.query;
        const result = await pool.query(
            `DELETE FROM actor WHERE id_actor = $1`
            , [Number(data.id_actor)]
        );

        errors.message = "Se eliminó el actor correctamente";
        errors.place = "eliminar_actor";
        res.redirect("/eliminar_actor");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_actor";
        console.log(error);
        res.redirect(302, "/eliminar_actor");
    }
} );

//eliminar_par_act

app.get("/eliminar_par_act", async(req, res) => {

    try {
        const nombrePelicula = req.query.nombre;

        const resultPelicula = await pool.query(
            `SELECT * FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [nombrePelicula]
        );

        const pelicula = resultPelicula.rows[0];
        
        res.render("eliminar_par_act", {pelicula, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/eliminar");
    }
} );

app.get("/eliminar_par_act2", async(req, res) => {

    try {
        const data = req.query;
        console.log(data);
        const resultPelicula = await pool.query(
            `SELECT * FROM pelicula WHERE id_pelicula = $1`
            , [Number(data.id_pelicula)]
        );

        const pelicula = resultPelicula.rows[0];

        const participante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre]
        );

        let resultActor;
        let actor;

        if(participante.rows.length !== 0) {
            resultActor = await pool.query(
                `SELECT * FROM actor WHERE id_participante_cf = $1`
                , [Number(participante.rows[0].id_participante)]
            );
            actor = resultActor.rows[0];
        } else {
            actor = undefined;
        }


        

        res.render("eliminar_par_act2", {pelicula, actor, errors, id_participante: participante.rows[0].id_participante});
        
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/eliminar_par_act");
    }
} );

app.get("/eliminar_par_act3", async(req, res) => {
    
    try {
        const data = req.query;


        const result = await pool.query(
            'SELECT * FROM participacion_actor WHERE id_pelicula_cf = $1 AND id_actor_cf = $2'
            , [Number(data.id_pelicula), Number(data.id_actor)]
        );

        if(result.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la participación";
            errors.place = "eliminar_par_act";
            res.redirect(302, "/eliminar_par_act");
            return;
        }

        //Comprombar que no haya una nominacion con el actor

        const resultNominacion = await pool.query(
            `SELECT * FROM nominacion WHERE id_pelicula_cf = $1 AND id_participante_cf = $2`
            , [Number(data.id_pelicula), Number(data.id_participante)]
        );

        if(resultNominacion.rows.length !== 0) {
            errors.status = true;
            errors.message = "El actor está nominado una gala";
            errors.place = "eliminar_par_act";
            res.redirect(302, "/eliminar_par_act");
            return;
        }


        const deletePar = await pool.query(
            `DELETE FROM participacion_actor WHERE id_pelicula_cf = $1 AND id_actor_cf = $2`
            , [Number(data.id_pelicula), Number(data.id_actor)]
        );
        
        errors.message = "Se eliminó la participación correctamente";
        errors.place = "eliminar_par_act";
        res.redirect("/eliminar_par_act");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_par_act";
        console.log(error);
        res.redirect(302, "/eliminar_par_act");
    }
} );

//eliminar_gala

app.get("/eliminar_gala", async(req, res) => {
    
    try {
        const data = req.query;
        data.anio_realizacion = data.anio_realizacion || 0;

        const result = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [data.nombre, Number(data.anio_realizacion)]
        );

        const gala = result.rows[0];
        res.render("eliminar_gala", {gala, errors});
    }
    catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/eliminar");
    }
} );


app.get("/eliminar_gala2", async(req, res) => {
    try {
        const data = req.query;
        const result = await pool.query(
            `DELETE FROM gala WHERE id_gala = $1`
            , [Number(data.id_gala)]
        );

        errors.message = "Se eliminó la gala correctamente";
        errors.place = "eliminar_gala";

        res.redirect("/eliminar_gala");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_gala";
        res.redirect(302, "/eliminar_gala");
    }
} );


// eliminar_nominacion

app.get("/eliminar_nominacion", async (req, res) => {

    try {
        const data = req.query;
        data.anio_realizacion ||= 0;

        const resultGala = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [data.nombre, Number(data.anio_realizacion)]
        )

        const gala = resultGala.rows[0];

        res.render("eliminar_nominacion", {gala, errors});
    } catch (error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/eliminar");
    }
} );

app.get("/eliminar_nominacion2", async(req, res) => {

    try {
        const data = req.query;

        const resultPelicula = await pool.query(
            `SELECT id_pelicula FROM pelicula WHERE titulo_original ILIKE $1 OR titulo_traducido ILIKE $1`
            , [data.pelicula]
        );

        

        if(resultPelicula.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            errors.place = "eliminar_nominacion";
            res.redirect(302, "/eliminar_nominacion");
            return;
        }

        const resultParticipante = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre_participante]
        );

        if(resultParticipante.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "eliminar_nominacion";
            res.redirect(302, "/eliminar_nominacion");
            return;
        }

        const resultNominacion = await pool.query(
            `SELECT id_nominacion FROM nominacion WHERE id_pelicula_cf = $1 AND id_participante_cf = $2 AND id_gala_cf = $3 AND categoria ILIKE $4`
            , [resultPelicula.rows[0].id_pelicula, resultParticipante.rows[0].id_participante, Number(data.id_gala), data.categoria]
        );

        if(resultNominacion.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la nominación";
            errors.place = "eliminar_nominacion";
            res.redirect(302, "/eliminar_nominacion");
            return;
        }

        const deleteNominacion = await pool.query(
            `DELETE FROM nominacion WHERE id_nominacion = $1`
            , [Number(resultNominacion.rows[0].id_nominacion)]
        );

        errors.message = "Se eliminó la nominación correctamente";
        errors.place = "eliminar_nominacion";
        res.redirect("/eliminar_nominacion");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_nominacion";
        res.redirect(302, "/eliminar_nominacion");
    }
} );


//eliminar_tribunal

app.get("/eliminar_tribunal", async(req, res) => {

    try {

        const data = req.query;
        data.anio_realizacion = data.anio_realizacion || 0;

        const result = await pool.query(
            `SELECT * FROM gala WHERE nombre ILIKE $1 AND anio_realizacion = $2`
            , [data.nombre, Number(data.anio_realizacion)]
        );

        const gala = result.rows[0];

        res.render("eliminar_tribunal", {gala, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/eliminar");
    }

} );


app.get("/eliminar_tribunal2", async(req, res) => {

    try {

        const data = req.query;

        const resultParticipante = await pool.query(
            `SELECT id_participante FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre]
        );

        if(resultParticipante.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "eliminar_tribunal";
            res.redirect(302, "/eliminar_tribunal");
            return;
        }

        const resultTribunal = await pool.query(
            `SELECT * FROM tribunal WHERE id_gala_cf = $1 AND id_participante_cf = $2`
            , [Number(data.id_gala), resultParticipante.rows[0].id_participante]
        );

        if(resultTribunal.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el tribunal";
            errors.place = "eliminar_tribunal";
            res.redirect(302, "/eliminar_tribunal");
            return;
        }

        const deleteTribunal = await pool.query(
            `DELETE FROM tribunal WHERE id_gala_cf = $1 AND id_participante_cf = $2`
            , [Number(data.id_gala), resultParticipante.rows[0].id_participante]
        );

        errors.message = "Se eliminó el tribunal correctamente";
        errors.place = "eliminar_tribunal";
        res.redirect("/eliminar_tribunal");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_tribunal";
        console.log(error);
        res.redirect(302, "/eliminar_tribunal");
    }
} );


//Toda la parte de director

app.get("/datos_dir", async(req, res) => {

    try {
        res.render("datos_dir", {errors});
    } catch(error) {
        res.status(500).send("Error")
        console.error(error);
    }
} );

app.get("/datos_dir2", async(req, res) => {

    try {
        const  data = req.query;

        const result = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre]
        );

        const par = result.rows[0];
        if(!par) {
            errors.status = true;
            errors.message = "No se encontró el participante";
            errors.place = "datos_dir";
            res.redirect(302, "/datos_dir");
            return;
        }
        res.render("datos_dir2", {par, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "datos_dir";
        res.redirect(302, "/datos_dir");
    }
} );


app.get("/insertar_dir", async(req, res) => {

    try {
        const data = req.query;
        const fecha = await pool.query(
            `SELECT fecha_nacimiento FROM participante WHERE id_participante = $1`
            , [Number(data.id_participante)]
        );

        const insert = await pool.query(
            `INSERT INTO director (
                id_participante_cf,
                anio_debut,
                nacionalidad,
                nacimiento,
                nombre,
                image_url
            ) VALUES ($1, $2, $3, $4, $5, $6)`
            , [Number(data.id_participante),
                Number(data.anio_debut),
                data.pais,
                fecha.rows[0].fecha_nacimiento,
                data.nombre_real,
                data.image_url
            ]
        );

        console.log(insert);
        errors.message = "Se insertó el director correctamente";
        errors.place = "datos_dir";
        res.redirect("/datos_dir");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "datos_dir";
        res.redirect(302, "/datos_dir");
    }
} );


app.get("/modificar_dir", async(req, res) => {
    try {
        const nombre = req.query.nombre;

    
        const resultParticipacion = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombre]
        );

  
        let result;
        let director;
        if(resultParticipacion.rows.length !== 0) {
            result = await pool.query(
                `SELECT * FROM director WHERE id_participante_cf = $1`
                , [Number(resultParticipacion.rows[0].id_participante)]
            );
            director = result.rows[0];
        } else {
            director = undefined;

        }       

        console.log(director);
        res.render("modificar_dir", {director, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/modificar");
    }
} );

app.get("/modificar_dir2", async(req, res) => {

    try {
        const data = req.query;
        console.log(data);
        const update = await pool.query(
            `UPDATE director SET
                anio_debut = $1,
                nacionalidad = $2
             WHERE id_director = $3;`
            , [Number(data.anio_debut),
                data.nacionalidad,
                Number(data.id_director)
            ]
        );

        console.log(update);
        errors.message = "Se modificó el director correctamente";
        errors.place = "modificar_dir";
        res.redirect("/modificar_dir");
    } catch(error) {
        errors.status = true;
        errors.message = error.message;
        errors.place = "modificar_dir";
        console.log(error);
        res.redirect(302, "/modificar_dir");
    }
} );
        

app.get("/modificar_par_dir", async(req, res) => {

    try {
        const nombreDirector = req.query.nombre;
        const nombrePelicula = req.query.pelicula;


        const resultParticipante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombreDirector]
        );
        let resultDirector;
        let director;
        if(resultParticipante.rows.length !== 0) {
            resultDirector = await pool.query(
                `SELECT * FROM director WHERE id_participante_cf = $1`
                , [Number(resultParticipante.rows[0].id_participante)]
            );
            director = resultDirector.rows[0];
        } else {
            director = undefined;
        }


        

        const resultPelicula = await pool.query(
            `SELECT * FROM pelicula WHERE titulo_original ILIKE $1`
            , [nombrePelicula]
        );

        
        const pelicula = resultPelicula.rows[0];

        let resultParticipacion;
        let participacion_director;

        if(!director || !pelicula) {
            resultParticipacion = participacion_director = undefined;
        } else {
            resultParticipacion = await pool.query(
                `SELECT * FROM participacion_director WHERE id_pelicula_cf = $1 AND id_director_cf = $2`
                , [Number(pelicula.id_pelicula), Number(director.id_director)]
            );
            participacion_director = resultParticipacion.rows[0];
        }
        console.log(participacion_director);
        console.log(director);
        console.log(pelicula);
        res.render("modificar_par_dir", {director, pelicula, participacion_director, errors});

    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        res.redirect(302, "/modificar");
    }
} );

app.get("/modificar_par_dir2", async(req, res) => {

    try {
        const data = req.query;
        console.log(data);
        const resultPelicula = await pool.query(
            `SELECT id_pelicula FROM pelicula WHERE titulo_original ILIKE $1`
            , [data.pelicula]
        );

        if(resultPelicula.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la pelicula";
            res.redirect(302, "/modificar_par_dir");
            return;
        }
        const update = await pool.query(
            `UPDATE participacion_director SET
                id_pelicula_cf = $1
            WHERE id_participacion_actor = $2;`
            , [Number(resultPelicula.rows[0].id_pelicula),
                Number(data.id_participacion_director)
            ]
        
        );

        console.log(update);
        errors.message = "Se modificó la participación correctamente";
        errors.place = "modificar_par_dir";
        res.redirect("/modificar_par_dir");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        console.log(error);
        errors.place = "modificar_par_dir";
        res.redirect(302, "/modificar_par_dir");
    }
} );
        

app.get("/eliminar_dir", async(req, res) => {

    try {
        const nombre = req.query.nombre;

        const participante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [nombre]
        );

        let result;
        let director;
        if(participante.rows.length !== 0) {
            result = await pool.query(
                `SELECT * FROM director WHERE id_participante_cf = $1`
                , [Number(participante.rows[0].id_participante)]
            );
            director = result.rows[0];
        } else {
            director = undefined;
        }

        res.render("eliminar_dir", {director, errors});
    }

    catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/datos_dir");
    }
} );

app.get("/eliminar_dir2", async(req, res) => {
    
    try {
        const data = req.query;
        const result = await pool.query(
            `DELETE FROM director WHERE id_director = $1`
            , [Number(data.id_director)]
        );

        errors.message = "Se eliminó el director correctamente";
        errors.place = "eliminar_dir";
        res.redirect("/eliminar_dir");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_dir";
        res.redirect(302, "/eliminar_dir");
    }
} );

app.get("/eliminar_par_dir", async(req, res) => {
    
    try {
        const nombrePelicula = req.query.nombre;

        const resultPelicula = await pool.query(
            `SELECT * FROM pelicula WHERE titulo_original ILIKE $1`
            , [nombrePelicula]
        );

        const pelicula = resultPelicula.rows[0];

        res.render("eliminar_par_dir", {pelicula, errors});
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        res.redirect(302, "/datos_dir");
    }
} );

app.get("/eliminar_par_dir2", async(req, res) => {

    try {
        const data = req.query;

        const resultPelicula = await pool.query(
            `SELECT * FROM pelicula WHERE id_pelicula = $1`
            , [Number(data.id_pelicula)]
        );

        console.log(resultPelicula.rows[0]);

        const participante = await pool.query(
            `SELECT * FROM participante WHERE nombre_real ILIKE $1 OR nombre_artistico ILIKE $1`
            , [data.nombre]
        );

        let resultDirector;
        let director;

        if(participante.rows.length !== 0) {
            resultDirector = await pool.query(
                `SELECT * FROM director WHERE id_participante_cf = $1`
                , [Number(participante.rows[0].id_participante)]
            );
            director = resultDirector.rows[0];
        } else {
            director = undefined;
        }

        // const resultDirector = await pool.query(
        //     `SELECT * FROM director WHERE nombre ILIKE $1`
        //     , [data.nombre]
        // );

        if(resultDirector.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró el director";
            errors.place = "eliminar_par_dir";
            res.redirect(302, "/eliminar_par_dir");
            return;
        }

        const resultParticipacion = await pool.query(
            `SELECT * FROM participacion_director WHERE id_pelicula_cf = $1 AND id_director_cf = $2`
            , [Number(data.id_pelicula), Number(resultDirector.rows[0].id_director)]
        );

        if(resultParticipacion.rows.length === 0) {
            errors.status = true;
            errors.message = "No se encontró la participación";
            errors.place = "eliminar_par_dir";
            res.redirect(302, "/eliminar_par_dir");
            return;
        }

        const pelicula = resultPelicula.rows[0];
        // const director = resultDirector.rows[0];
        const participacion = resultParticipacion.rows[0];

        res.render("eliminar_par_dir2", {pelicula, director, participacion, errors, id_participante: participante.rows[0].id_participante});

    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_par_dir";
        console.log(error);

        res.redirect(302, "/eliminar_par_dir");
    }
} );

app.get("/eliminar_par_dir3", async(req, res) => {

    try {
        console.log(req.query);
        const id_participacion_director = req.query.id_participacion_director;
        console.log(id_participacion_director);


        //Comprombar que no haya una nominacion con el director

        const resultNominacion = await pool.query(
            `SELECT * FROM nominacion WHERE id_pelicula_cf = $1 AND id_participante_cf = $2`
            , [Number(req.query.id_pelicula), Number(req.query.id_participante)]
        );

        if(resultNominacion.rows.length !== 0) {
            errors.status = true;
            errors.message = "El director está nominado una gala";
            errors.place = "eliminar_par_dir";
            res.redirect(302, "/eliminar_par_dir");
            return;
        }


        const deletePar = await pool.query(
            `DELETE FROM participacion_director WHERE id_participacion_actor = $1`
            , [Number(id_participacion_director)]
        );

        errors.message = "Se eliminó la participación correctamente";
        errors.place = "eliminar_par_dir";
        res.redirect("/eliminar_par_dir");
    } catch(error) {
        errors.status = true;
        errors.message = error.detail;
        errors.place = "eliminar_par_dir";
        console.log(error);
        res.redirect(302, "/eliminar_par_dir");
    }
} );

app.listen(port, () => {
    console.log(`Servidor Express corriendo en http://localhost:${port}`);
});