//Funcion para formatear la fecha en formato aaaa-mm-dd

export const formatearFecha = (fecha) => {
    const fechaFormateada = new Date(fecha);
    const dia = fechaFormateada.getDate();
    const mes = fechaFormateada.getMonth() + 1;
    const anio = fechaFormateada.getFullYear();
    return `${anio}-${mes < 10 ? `0${mes}` : mes}-${dia < 10 ? `0${dia}` : dia}`;
}