import dotenv from 'dotenv';
import { monitorBlocks } from './monitor/BlockMonitor';
import { monitorSlots } from './monitor/SlotMonitor';

dotenv.config();

// Choose which monitoring to start
monitorBlocks().catch(console.error);
// monitorSlots().catch(console.error);
