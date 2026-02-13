
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking 'states' table...");
    const { data: states, error: statesError } = await supabase
        .from('states')
        .select('*')
        .limit(5);

    if (statesError) {
        console.error("Error fetching states:", statesError);
    } else {
        console.log(`Found ${states?.length} states.`);
        if (states && states.length > 0) {
            console.log("Sample State:", states[0]);
        } else {
            console.log("States table is empty!");
        }
    }

    console.log("\nChecking 'districts' table...");
    const { data: districts, error: distError } = await supabase
        .from('districts')
        .select('*')
        .limit(5);

    if (distError) console.error("Error fetching districts:", distError);
    else console.log(`Found ${districts?.length} districts.`);

    console.log("\nChecking 'offices' table...");
    const { data: offices, error: offError } = await supabase
        .from('offices')
        .select('*')
        .limit(5);

    if (offError) console.error("Error fetching offices:", offError);
    else console.log(`Found ${offices?.length} offices.`);
}

checkData();
