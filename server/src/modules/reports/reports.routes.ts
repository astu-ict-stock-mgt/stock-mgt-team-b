import {Router} from "express";
import { getStockTransactionSummary } from "./reports.controller.ts";

const router = Router();

router.get("/summary",
    getStockTransactionSummary
);

export default router;