
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('presentations')
        .select('title, slides')
        .ilike('title', '%Ethos%')
        .limit(1);

    if (error) {
        console.error('Error fetching presentation:', error);
        return;
    }

    if (data && data.length > 0) {
        // console.log('Found presentation:', data[0].title);
        const slides = data[0].slides;
        const slideList = Array.isArray(slides) ? slides : slides.slides || [];

        const targetSlide = slideList.find(s =>
            JSON.stringify(s).includes('Year 1 Revenue')
        );

        if (targetSlide) {
            const chartData = targetSlide.chart || (targetSlide.content && targetSlide.content.chart);
            if (chartData) {
                console.log(JSON.stringify(chartData, null, 2));
            } else {
                console.log("No chart data in target slide");
            }
        } else {
            console.log("Target slide not found");
        }

    } else {
        console.log('Presentation not found');
    }
}

main();
