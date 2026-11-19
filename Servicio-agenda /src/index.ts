import express,{Request, Response} from "express";

const PORT= Number(process.env.PORT??3001);

const RETARDO_MS=Number(process.env.RETARDO_MS??1000);
interface Medico{
    id:string;
    nombre:string;
    especialidad:string;
    cupos:number;
}

const medicos:Medico[] = [
    {id:"MED-01", nombre: "Dra. Nobara Pérez", especialidad: "Medicina general", cupos:20},
    {id:"MED-02", nombre: "Dr. Geto Loor", especialidad: "Pediatría", cupos:1},
    {id:"MED-03", nombre: "Dr. Ryomen Mera", especialidad: "Cardiología", cupos:0},
    {id:"MED-04", nombre: "Dr. Jose Macias", especialidad: "Urologia", cupos:4},
    {id:"MED-05", nombre: "Dr. Carlos Intriago", especialidad: "Psiquiatria", cupos:7},
    
];

const esperar = (ms:number)=> new Promise <void>((r)=> setTimeout(r,ms));
const app= express();

app.use(express.json());

type ReservaCita = { id: string; cupos: number; cuposRestante: number };
const reservas = new Map<string, ReservaCita>();

app.get("/health",(_req: Request, res: Response) =>{

    res.json({status:"ok",servicio: "agenda"});
});


app.get("/medicos", async (req: Request,res: Response) =>{

    if(RETARDO_MS>0) await esperar ( RETARDO_MS);
    
    res.status(200).json(medicos);

});

app.post("/medicos/:id/reservar", async (req: Request<{id:number}>, res: Response) => {
    if(RETARDO_MS > 0) await esperar(RETARDO_MS);
    const { cantidad } = req.body ?? {};
    if (!Number.isInteger(cantidad) || cantidad <= 0){
        res.status(400).json({error:"cantidad invalida"});
        return;
    }
    const id = req.params.id;
    const key = req.header("idempotency-key");

    // Idempotencia: si ya procesamos esta clave, devolvemos el mismo resultado
    // sin descontar el stock otra vez. Se consulta después del await para que
    // el tramo comprobar -> descontar -> guardar sea atómico (sin interrupciones).
    if (key) {
        const previa = reservas.get(key);
        if (previa) {
            if (previa.id !== id || previa.cupos !== cantidad) {
                res.status(409).json({ error: "idempotency-key reutilizada con otros datos" });
                return;
            }
            res.status(201).json({ id, reservado: previa.cupos, restante: previa.cuposRestante });
            return;
        }
    }

    const disponible = cupos.get(id);
    if (disponible === undefined){
        res.status(404).json({error:"ID no encontrado"})
        return;
    }
    if (disponible < cantidad) {
        res.status(409).json({ error: "cupos insuficiente", restante: disponible });
        return;
    }
    const nuevo = disponible - cantidad;
    cupos.set(id, nuevo);
    if (key) reservas.set(key, { id, cupos, cuposRestante: nuevo });
    res.status(201).json({ id, reservado: cupos, restante: nuevo });
});


app.listen(PORT,()=>{

    console.log("servicios de agenda escuchando en el puerto: "+PORT+ " retraso: "+RETARDO_MS+"ms");
});



