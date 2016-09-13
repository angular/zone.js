import '../zone';
import {patchTimer} from '../common/timers';


const set = 'set';
const clear = 'clear';

// Timers
patchTimer(global, set, clear, 'Timeout');
patchTimer(global, set, clear, 'Interval');
patchTimer(global, set, clear, 'Immediate');
