import {Request,Response,NextFunction} from "express";

import{
    getIssuingReport,
    getReceivingReport,
    getStockMovementReport,
    getstockMovementReport,
}from "./reports.service.ts";

function parseDate(value:unknown):Date|
undefined{
    if(typeof value!=="string"||!value){
        return undefined;
    }

    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return undefined;
    }
    return date;
}
export async function stockMovementReport(
    req:Request,
    res:Response,
    next:NextFunction,
){
    try{
        const result =await getStockMovementReport({
            dateFrom:parseDate(req.query.dateFrom),
            dateTo:parseDate(req.query.dateTo),
            warehouseId:
            typeof req.query.warehouseId ==="string":undefined,
            supplierId:
            typeof req.query.supplierId ==="string"
            ?req.query.supplierId
            :undefined,
            inventoryItemId:
            typeof req.query.inventoryItemId ==="string"
            ?req.query.inventoryItemId :
            undefined,
        });

        res.status(200).json({
            success:true,
            data:result,
        });
    }catch(error){
        next(error);
    }
}

export async function receivingReport(
    req:Request,
    res:Response,
    next:NextFunction,
){
    try{
        const result = await getReceivingReport({
            dateFrom:parseDate(req.query.dateFrom),
            dateTo:parseDate(req.query.dateTo),
            warehouseId:
            typeof req.query.warehouseId ==="string"
            ?req.query.warehouseId
            :undefined,
            supplierId:
            typeof req.query.warehouseId ==="string"
            ?req.query.supplierId
            :undefined,

            inventoryItemId:
            typeof req.query.inventoryItemId ==="string"
            ?req.query.inventoryItemId
            :undefined,
        });

        res.status(200).json({
            success:true,
            data:result,
        });
    }catch(error){
        next(error);
    }
}
export async function issuingReport(
    req:Request,
    res:Response,
    next:NextFunction,
){
    try{
        const result = await getIssuingReport({
            dateFrom:parseDate(req.query.dateFrom),
            dateTo:parseDate(req.query.dateTo),
            warehouseId:
            typeof req.query.warehouseId ==="string"
            ?req.query.warehouseId
            :undefined,

            inventoryItemId:
            typeof req.query.inventoryItemId ==="string"
            ?req.query.inventoryItemId
            :undefined,
        });
        res.status(200).json({
            success:true,
            data:result,
        });
    }catch(error){
        next(error);
    }
}