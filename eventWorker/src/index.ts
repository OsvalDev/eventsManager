import cron from 'node-cron';
// --- Cron Schedules ---
import updateDimentions from './tasks/updateDimentions';
import updateInventory from './tasks/updateInventory';

/**
 *  Schedule format reference:
 *  * * * * * *
 *  | | | | | |
 *  | | | | | day of week
 *  | | | | month
 *  | | | day of month
 *  | | hour
 *  | minute
 *  second (optional)
 */

//Runs at 7:00 AM and 12:00 PM, Monday through Friday
cron.schedule('0 7,12 * * 1-5', () => {
  updateInventory();
});

//Runs at 12:30 AM, Monday
cron.schedule('30 0 * * 1', () => {
  updateDimentions();
});

console.log('🚀 Event Worker initialized and crons scheduled.');
