
let obj = {};
obj.loc = 'muse';

const boundaries = [
    {
        key: 'muse',
        values: [500, 745, 980, 1180, 1340]
    },
    {
        key: 'idc',
        values: [185, 530, 930, 1255, 1575]
    },
    {
        key: 'fac',
        values: [240, 620, 980, 1310, 1570]
    }
];

const scaleTime = d3.scaleTime();
const scaleSpace = {};
scaleSpace.slot0 = d3.scaleLinear();
scaleSpace.slot1 = d3.scaleLinear();
scaleSpace.slot2 = d3.scaleLinear();
scaleSpace.slot3 = d3.scaleLinear();
const scaleDur = d3.scaleSequential(d3.interpolateGreys);
const scaleVac = d3.scaleSequential(d3.interpolateRdPu);

const scaleTimeSupp = d3.scaleTime();
const scaleUtil = d3.scaleLinear().range(0,1);

const data = [];

resize();

Promise.all([
    d3.csv('./data/mus_100717.csv',parse),
    d3.csv('./data/mus_110717.csv',parse),
    d3.csv('./data/mus_120717.csv',parse),
    d3.csv('./data/mus_130717.csv',parse),
    d3.csv('./data/idc_100717.csv',parse),
    d3.csv('./data/idc_110717.csv',parse),
    d3.csv('./data/idc_120717.csv',parse),
    d3.csv('./data/idc_130717.csv',parse),
    d3.csv('./data/idc_140717.csv',parse),
    d3.csv('./data/fac_100717.csv',parse),
    d3.csv('./data/fac_110717.csv',parse),
    d3.csv('./data/fac_120717.csv',parse),
    d3.csv('./data/fac_130717.csv',parse),
    d3.csv('./data/fac_140717.csv',parse)
]).then(([muse10,muse11,muse12,muse13,idc10,idc11,idc12,idc13,idc14,fac10,fac11,fac12,fac13,fac14]) => {

    data.push({
        key: 'muse',
        values: [
            {
                key: 'day-10',
                values: muse10
            },
            {
                key: 'day-11',
                values: muse11
            },
            {
                key: 'day-12',
                values: muse12
            },
            {
                key: 'day-13',
                values: muse13
            }
        ]
    });

    data.push({
        key: 'idc',
        values: [
            {
                key: 'day-10',
                values: idc10
            },
            {
                key: 'day-11',
                values: idc11
            },
            {
                key: 'day-12',
                values: idc12
            },
            {
                key: 'day-13',
                values: idc13
            },
            {
                key: 'day-14',
                values: idc14
            }
        ]
    });

    data.push({
        key: 'fac',
        values: [
            {
                key: 'day-10',
                values: fac10
            },
            {
                key: 'day-11',
                values: fac11
            },
            {
                key: 'day-12',
                values: fac12
            },
            {
                key: 'day-13',
                values: fac13
            },
            {
                key: 'day-14',
                values: fac14
            }
        ]
    });
    
    // in data, "vacancy" and "unused" are the same, eliminate variable or recalculate one
    data.forEach(function(l){
        l.values.forEach(function(d){
            d.values.forEach(function(t,n){
                // for each slot...
                let i=0;
                while(i < 4){
                    if(t[`dur_s${i}`] > 0 || t[`in_s${i}`] == 1 || t[`out_s${i}`] == 1){
                        t[`dur_unused_s${i}`] = 0;
                        t[`dur_vacant_s${i}`] = 0;
                        if(n == 0){
                            t[`dur_vacant_final_s${i}`] = 0;
                        }else{
                            t[`dur_vacant_final_s${i}`] = d.values[n-1][`dur_vacant_s${i}`];
                        }
                    }else{
                        if(n == 0){
                            t[`dur_unused_s${i}`] = 0;
                            t[`dur_vacant_s${i}`] = 0;
                        }else{
                            t[`dur_unused_s${i}`] = d.values[n-1][`dur_unused_s${i}`] + 15;
                            t[`dur_vacant_s${i}`] = (t[`util_s${i}`] > 0) ? 0 : d.values[n-1][`dur_vacant_s${i}`] + 15;
                        }
                    }
                    i++;
                }
            })
        })
    })

    console.log(data);
    enterExitUpdate(data[0]);
    generateStackedArea(data[0],'as');
    generateStackedArea(data[0],'ws');


    // btn functionality
    d3.selectAll('.btn-loc')
        .on('click',function(){
            const thisId = d3.select(this).attr('id');
            if(d3.select(this).classed('btn-active') == false){
                d3.selectAll('.btn-loc').classed('btn-active',false);
                d3.select(this).classed('btn-active',true);
                obj.loc = thisId.substr(4, thisId.length-1);
                const index = data.map(d => d.key).indexOf(obj.loc);
                enterExitUpdate(data[index]);
                generateStackedArea(data[index],'as');
                generateStackedArea(data[index],'ws');
            
            }
        });
    d3.select('#btn-main')
        .on('click',mainView);
    d3.select('#btn-ws')
        .on('click',wastedSpace);
    d3.select('#btn-as')
        .on('click',abusedSystem);
    d3.select('#btn-hot')
        .on('click',spotHotness);
        
    
})

function parse(row){
    const date = `20${row.frametime_original.substr(5,2)}-0${row.frametime_original.substr(0,1)}-${row.frametime_original.substr(2,2)}`;
    const hr = (row.frametime.charAt(1) == ':') ? row.frametime.substr(0,1) : row.frametime.substr(0,2);
    const min = (row.frametime.charAt(1) == ':') ? row.frametime.substr(2,2) : row.frametime.substr(3,2);
    const sec = (row.frametime.charAt(1) == ':') ? row.frametime.substr(5,2) : row.frametime.substr(6,2);
    const time = `T${hr}:${min}:${sec}Z`;
    const timeBusiness = (+hr > 7 && +hr < 18) ? 1 : 0;

    const utilS0 = +(row.measured_utilization_lot_0.substr(0,row.measured_utilization_lot_0.indexOf('%'))) * 0.01;
    const utilS1 = +(row.measured_utilization_lot_1.substr(0,row.measured_utilization_lot_1.indexOf('%'))) * 0.01;
    const utilS2 = +(row.measured_utilization_lot_2.substr(0,row.measured_utilization_lot_2.indexOf('%'))) * 0.01;
    const utilS3 = +(row.measured_utilization_lot_3.substr(0,row.measured_utilization_lot_3.indexOf('%'))) * 0.01;
    const utilTotal = +(row.avg_measured_utilization_of_total.substr(0,row.avg_measured_utilization_of_total.length-1)) * 0.01;
    const unusedTotal = +(row.avg_measured_unused_of_total.substr(0,row.avg_measured_unused_of_total.length-1)) * 0.01;

    const durS0 = +row.accum_time_used_slot_0_per_vehicle;
    const durS1 = +row.accum_time_used_slot_1_per_vehicle;
    const durS2 = +row.accum_time_used_slot_2_per_vehicle;
    const durS3 = +row.accum_time_used_slot_3_per_vehicle;

    const expiredS0 = (durS0 >= 7200) ? 1 : 0;
    const expiredS1 = (durS1 >= 7200) ? 1 : 0;
    const expiredS2 = (durS2 >= 7200) ? 1 : 0;
    const expiredS3 = (durS3 >= 7200) ? 1 : 0;

    let metered_total = 0;
    let expired_total = 0;
    let expired_nb_total = 0;
    let unmetered_total = 0;
    let unused_inspot_total = 0;
    let vacancy_total = 0;

    if(timeBusiness == 1){
        if(expiredS0 == 1){ expired_total += utilS0; }else{ metered_total += utilS0; }
        if(expiredS1 == 1){ expired_total += utilS1; }else{ metered_total += utilS1; }
        if(expiredS2 == 1){ expired_total += utilS2; }else{ metered_total += utilS2; }
        if(expiredS3 == 1){ expired_total += utilS3; }else{ metered_total += utilS3; }
    }else if(timeBusiness == 0){
        if(expiredS0 == 1){ expired_nb_total += utilS0; }else{ unmetered_total += utilS0; }
        if(expiredS1 == 1){ expired_nb_total += utilS1; }else{ unmetered_total += utilS1; }
        if(expiredS2 == 1){ expired_nb_total += utilS2; }else{ unmetered_total += utilS2; }
        if(expiredS3 == 1){ expired_nb_total += utilS3; }else{ unmetered_total += utilS3; }
        // unmetered_total = (utilS0 + utilS1 + utilS2 + utilS3);
    }

    if(utilS0 > 0){ unused_inspot_total += (1-utilS0); }else{ vacancy_total += (1-utilS0); }
    if(utilS1 > 0){ unused_inspot_total += (1-utilS1); }else{ vacancy_total += (1-utilS1); }
    if(utilS2 > 0){ unused_inspot_total += (1-utilS2); }else{ vacancy_total += (1-utilS2); }
    if(utilS3 > 0){ unused_inspot_total += (1-utilS3); }else{ vacancy_total += (1-utilS3); }

    metered_total = metered_total/4;
    expired_total = expired_total/4;
    expired_nb_total = expired_nb_total/4;
    unmetered_total = unmetered_total/4;
    unused_inspot_total = unused_inspot_total/4;
    vacancy_total = vacancy_total/4;

    return {
        frame: row.frame_no,
        frametime: new Date('2017', '06', row.frametime_original.substr(2,2), hr, min, sec),
        frametime_strd: (hr != '0') ? new Date('2017', '06', '10', hr, min, sec) : new Date('2017', '06', '11', hr, min, sec),
        business_hrs: timeBusiness,
        in_s0: +row.in_slot_0,
        in_s1: +row.in_slot_1,
        in_s2: +row.in_slot_2,
        in_s3: +row.in_slot_3,
        util_s0: utilS0,
        util_s1: utilS1,
        util_s2: utilS2,
        util_s3: utilS3,
        util_total: utilTotal,
        unused_total: unusedTotal,
        metered_total: metered_total,
        expired_total: expired_total,
        expired_nb_total: expired_nb_total,
        unmetered_total: unmetered_total,
        unused_inspot_total: unused_inspot_total,
        vacancy_total: vacancy_total,
        spot_util: +row.agg_net_space_util,
        spot_unused: +row.agg_unused_space,
        coord_start_s0: +row.coordinate_start_slot_0,
        coord_end_s0: +row.coordinate_end_slot_0,
        coord_start_s1: +row.coordinate_start_slot_1,
        coord_end_s1: +row.coordinate_end_slot_1,
        coord_start_s2: +row.coordinate_start_slot_2,
        coord_end_s2: +row.coordinate_end_slot_2,
        coord_start_s3: +row.coordinate_start_slot_3,
        coord_end_s3: +row.coordinate_end_slot_3,
        dur_s0: durS0,
        dur_s1: durS1,
        dur_s2: durS2,
        dur_s3: durS3,
        dur_final_s0: +row.final_time_used_slot_0_per_vehicle,
        dur_final_s1: +row.final_time_used_slot_1_per_vehicle,
        dur_final_s2: +row.final_time_used_slot_2_per_vehicle,
        dur_final_s3: +row.final_time_used_slot_3_per_vehicle,
        expired_s0: expiredS0,
        expired_s1: expiredS1,
        expired_s2: expiredS2,
        expired_s3: expiredS3
    }
}

function resize(){
    const w = d3.select('#parking-col').node().clientWidth;
    obj.h = w * 0.25;
    const y = d3.select('#parking-row').node().getBoundingClientRect().y;

    d3.select('#parking')
        .attr('width',w-30)
        .attr('height',(obj.h*5));

    scaleTime.range([20,w-20-30]);

    // const suppW = d3.select('#col-supp').node().clientWidth;

    // d3.select('#supp')
    //     .attr('width',suppW)
    //     .attr('height',(h*4));

    // scaleUtil.range([h-80,20]);
    // scaleTimeSupp.range([20,suppW-20-30]);

    // d3.select('#supp').selectAll('.g-day')
    //     .attr('transform',(d,i) => `translate(0,${i * h})`);
}

function enterExitUpdate(data){
    const slotCoord = boundaries.find(d => d.key == obj.loc).values;
    const slotH = Math.floor((obj.h-80)/(slotCoord.length*2));
    scaleSpace.slot0.domain([slotCoord[0],slotCoord[1]]).range([60,60+slotH]);
    scaleSpace.slot1.domain([slotCoord[1],slotCoord[2]]).range([60+slotH,60+(slotH*2)]);
    scaleSpace.slot2.domain([slotCoord[2],slotCoord[3]]).range([60+(slotH*2),60+(slotH*3)]);
    scaleSpace.slot3.domain([slotCoord[3],slotCoord[4]]).range([60+(slotH*3),60+(slotH*4)]);
    scaleUtil.range([obj.h-60,100+(slotH*4)]);

    let durMax = 0,
        vacMax = 0,
        timeMin, timeMax;
    data.values.forEach(function(day,i){
        const durMaxDay = Math.max(d3.max(day.values, d => d.dur_s0),d3.max(day.values, d => +d.dur_s1),d3.max(day.values, d => +d.dur_s2),d3.max(day.values, d => +d.dur_s3));
        const vacMaxDay = Math.max(d3.max(day.values, d => d.dur_vacant_s0),d3.max(day.values, d => +d.dur_vacant_s1),d3.max(day.values, d => +d.dur_vacant_s2),d3.max(day.values, d => +d.dur_vacant_s3));
        const timeMinDay = d3.min(day.values, d => d.frametime_strd.getTime());
        const timeMaxDay = d3.max(day.values, d => d.frametime_strd.getTime());
        durMax = (durMaxDay > durMax) ? durMaxDay : durMax;
        vacMax = (vacMaxDay > vacMax) ? vacMaxDay : vacMax;
        timeMin = (i == 0) ? timeMinDay : (timeMinDay < timeMin) ? timeMinDay : timeMin;
        timeMax = (i == 0) ? timeMaxDay : (timeMaxDay > timeMax) ? timeMaxDay : timeMax;
    })
    scaleDur.domain([0,durMax*2]);
    scaleVac.domain([7200,-3600]);
    obj.timeMin = new Date(timeMin);
    obj.timeMax = new Date(timeMax);
    scaleTime.domain([obj.timeMin,obj.timeMax]);

    const axisTime = d3.axisTop()
        .scale(scaleTime)
        .tickFormat(d3.timeFormat('%I %p'));

    // join data
    const days = d3.select('#parking').selectAll('.g-day')
        .data(data.values);

    // update existing g-elements
    days.each(function(e,index){
        const day = d3.select(this);

        day.selectAll('.line-boundary')
            .data(slotCoord)
            .attr('x1', scaleTime(timeMin))
            .attr('x2', scaleTime(timeMax))
            .attr('y1', (d,i) => {
                const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;
                return scaleY(d);
            })
            .attr('y2', (d,i) => {
                const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;
                return scaleY(d);
            });

        day.select('.g-axis')
            .call(axisTime);

        let i = 0;
        while(i < 4){
            const slot = day.select(`#g-slot${i}-unused`);
            const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;

            // join data
            const lineUnused = slot.select('.g-unused').selectAll('line')
                .data(e.values.filter(d => d[`util_s${i}`] > 0));

            const lineVacant = slot.select('.g-vacant').selectAll('line')
                .data(e.values.filter(d => d[`dur_vacant_s${i}`] > 0));

            // add new lines and update
            lineUnused.enter()
                .append('line')
                .attr('class','line-unused hidden')
                .merge(lineUnused)
                .attr('x1', d => scaleTime(d.frametime_strd))
                .attr('x2', d => scaleTime(d.frametime_strd))
                .attr('y1',scaleY(slotCoord[i]))
                .attr('y2',scaleY(slotCoord[i+1]));

            lineVacant.enter()
                .append('line')
                .attr('class','line-vacant hidden')
                .merge(lineVacant)
                .attr('x1', d => scaleTime(d.frametime_strd))
                .attr('x2', d => scaleTime(d.frametime_strd))
                .attr('y1',scaleY(slotCoord[i]))
                .attr('y2',scaleY(slotCoord[i+1]));
                // .style('stroke',d => scaleVac(d[`dur_vacant_s${i}`]));

            // remove old lines
            lineUnused.exit().remove();
            lineVacant.exit().remove();

            i++;
        }

        i = 0;
        while(i < 4){
            const slot = day.select(`#g-slot${i}-viol`);
            const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;

            const lineBefore = slot.select('.g-violated-before').selectAll('line')
                .data(e.values.filter(d => d[`util_s${i}`] > 0 && d[`coord_start_s${i}`] < slotCoord[i]));

            lineBefore.enter()
                .append('line')
                .attr('class',`line-violated hidden`)
                .merge(lineBefore)
                .attr('x1', d => scaleTime(d.frametime_strd))
                .attr('x2', d => scaleTime(d.frametime_strd))
                .attr('y1', d => scaleY(d[`coord_start_s${i}`]))
                .attr('y2', scaleY(slotCoord[i]))
                .style('opacity', (i == 0) ? 0.5 : 1);

            const lineAfter = slot.select('.g-violated-after').selectAll('line')
                .data(e.values.filter(d => d[`util_s${i}`] > 0 && d[`coord_end_s${i}`] > slotCoord[i+1]));

            lineAfter.enter()
                .append('line')
                .attr('class',`line-violated hidden`)
                .merge(lineAfter)
                .attr('x1', d => scaleTime(d.frametime_strd))
                .attr('x2', d => scaleTime(d.frametime_strd))
                .attr('y1', scaleY(slotCoord[i+1]))
                .attr('y2', d => scaleY(d[`coord_end_s${i}`]))
                .style('opacity', (i+1 == 4) ? 0.5 : 1);

            lineBefore.exit().remove();
            lineAfter.exit().remove();

            i++;
        }

        i = 0;
        while(i < 4){
            const slot = day.select(`#g-slot${i}-util`);
            const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;

            const lineUtil = slot.select('.g-util').selectAll('line')
                .data(e.values.filter(d => d[`util_s${i}`] > 0));

            lineUtil.enter()
                .append('line')
                .attr('id',d => `line-s${i}-f${d.frame}`)
                .merge(lineUtil)
                .attr('class',`line-util line-slot${i}`)
                .attr('id',d => `line-s${i}-f${d.frame}`)
                .attr('class',`line-util line-slot${i}`)
                .attr('x1', d => scaleTime(d.frametime_strd))
                .attr('x2', d => scaleTime(d.frametime_strd))
                .attr('y1', d => scaleY(d[`coord_start_s${i}`]))
                .attr('y2', d => scaleY(d[`coord_end_s${i}`]));

            lineUtil.exit().remove();

            i++;
        }

        day.selectAll('.line-business')
            .attr('x1',d => scaleTime(d))
            .attr('y1',scaleSpace.slot0(slotCoord[0]))
            .attr('x2',d => scaleTime(d))
            .attr('y2',scaleSpace.slot3(slotCoord[4]));
    })

    // append new g-elements
    days.enter().append('g')
        .attr('class','g-day')
        .attr('id',(d,i) => `g-day-${i}`)
        .attr('transform',(d,i) => `translate(0,${i * obj.h})`)
        .each(function(e,index){
            const day = d3.select(this);

            day.append('g')
                .attr('class','g-label')
                .attr('transform',`translate(0,20)`)
                .append('text')
                .text(e => `july ${e.values[0].frametime.getDate()}`);

            day.append('g')
                .attr('class','g-axis')
                .call(axisTime)
                .attr('transform',`translate(0,${40})`);

            day.append('g')
                .attr('id','g-slot-boundaries')
                .selectAll('line')
                .data(slotCoord)
                .enter()
                .append('line')
                .attr('class','line-boundary')
                .attr('x1', scaleTime(timeMin))
                .attr('x2', scaleTime(timeMax))
                .attr('y1', (d,i) => {
                    const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;
                    return scaleY(d);
                })
                .attr('y2', (d,i) => {
                    const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;
                    return scaleY(d);
                });

            let i = 0;
            while(i < 4){
                const slot = day.append('g')
                    .attr('class','g-slot')
                    .attr('id',`g-slot${i}-unused`);
        
                const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;
        
                slot.append('g')
                    .attr('class','g-unused')
                    .selectAll('line')
                    .data(e.values.filter(d => d[`util_s${i}`] > 0))
                    .enter()
                    .append('line')
                    .attr('class','line-unused hidden')
                    .attr('x1', d => scaleTime(d.frametime_strd))
                    .attr('x2', d => scaleTime(d.frametime_strd))
                    .attr('y1',scaleY(slotCoord[i]))
                    .attr('y2',scaleY(slotCoord[i+1]));

                slot.append('g')
                    .attr('class','g-vacant')
                    .selectAll('line')
                    .data(e.values.filter(d => d[`dur_vacant_s${i}`] > 0))
                    .enter()
                    .append('line')
                    .attr('class','line-vacant hidden')
                    .attr('x1', d => scaleTime(d.frametime_strd))
                    .attr('x2', d => scaleTime(d.frametime_strd))
                    .attr('y1',scaleY(slotCoord[i]))
                    .attr('y2',scaleY(slotCoord[i+1]));
                    // .style('stroke',d => scaleVac(d[`dur_vacant_s${i}`]));
        
                i++;
            }

            i = 0;
            while(i < 4){
                const slot = day.append('g')
                    .attr('class','g-slot')
                    .attr('id',`g-slot${i}-util`);
    
                const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;

                slot.append('g')
                    .attr('class','g-util')
                    .selectAll('line')
                    .data(e.values.filter(d => d[`util_s${i}`] > 0))
                    .enter()
                    .append('line')
                    .attr('id',d => `line-s${i}-f${d.frame}`)
                    .attr('class',`line-util line-slot${i}`)
                    .attr('x1', d => scaleTime(d.frametime_strd))
                    .attr('x2', d => scaleTime(d.frametime_strd))
                    .attr('y1', d => scaleY(d[`coord_start_s${i}`]))
                    .attr('y2', d => scaleY(d[`coord_end_s${i}`]));

                i++;
            }

            i = 0;
            while(i < 4){
                const slot = day.append('g')
                    .attr('class','g-violated')
                    .attr('id',`g-slot${i}-viol`);
        
                const scaleY = (i == 0) ? scaleSpace.slot0 : (i == 1) ? scaleSpace.slot1 : (i == 2) ? scaleSpace.slot2 : scaleSpace.slot3;
        
                slot.append('g')
                    .attr('class','g-violated-before')
                    .selectAll('line')
                    .data(e.values.filter(d => d[`util_s${i}`] > 0 && d[`coord_start_s${i}`] < slotCoord[i]))
                    .enter()
                    .append('line')
                    .attr('class',`line-violated hidden`)
                    .attr('x1', d => scaleTime(d.frametime_strd))
                    .attr('x2', d => scaleTime(d.frametime_strd))
                    .attr('y1', d => scaleY(d[`coord_start_s${i}`]))
                    .attr('y2', scaleY(slotCoord[i]))
                    .style('opacity', (i == 0) ? 0.5 : 1);
        
                slot.append('g')
                    .attr('class','g-violated-after')
                    .selectAll('line')
                    .data(e.values.filter(d => d[`util_s${i}`] > 0 && d[`coord_end_s${i}`] > slotCoord[i+1]))
                    .enter()
                    .append('line')
                    .attr('class',`line-violated hidden`)
                    .attr('x1', d => scaleTime(d.frametime_strd))
                    .attr('x2', d => scaleTime(d.frametime_strd))
                    .attr('y1', scaleY(slotCoord[i+1]))
                    .attr('y2', d => scaleY(d[`coord_end_s${i}`]))
                    .style('opacity', (i+1 == 4) ? 0.5 : 1);

                i++;
            }

            const busDayStart = new Date(2017,6,e.values[0].frametime_strd.getDate(),8);
            const busDayEnd = new Date(2017,6,e.values[0].frametime_strd.getDate(),18);

            day.append('g')
                .attr('class','g-business hidden')
                .selectAll('.line-business')
                .data([busDayStart,busDayEnd])
                .enter()
                .append('line')
                .attr('class','line-business')
                .attr('x1',d => scaleTime(d))
                .attr('y1',scaleSpace.slot0(slotCoord[0]))
                .attr('x2',d => scaleTime(d))
                .attr('y2',scaleSpace.slot3(slotCoord[4]));

                
    
        })

    // remove old g-elements
    days.exit().remove();

    mainView();
}

function generateStackedArea(data,story){
    const keys = (story == 'as') ? ['metered_total','unmetered_total','expired_total','expired_nb_total'/*,'unused_total'*/] : ['vacancy_total',/*'violated',*/'unused_inspot_total','util_total'];
    const stack = d3.stack()
        .keys(keys);

    const area = d3.area()
        // .curve(d3.curveCatmullRom)
        .curve(d3.curveBasis)
        .x(d => scaleTime(d.data.frametime_strd))
        .y0(d => scaleUtil(d[0]))
        .y1(d => scaleUtil(d[1]));
    
    if(story == 'as'){
        console.log(stack(data.values[0].values));
        const colorArea = d3.scaleOrdinal()
            .domain(keys)
            .range(['#616161','#616161','#EF5350','#81D4FA'/*,'#FAFAFA'*/])

        const system = d3.selectAll('.g-day').selectAll('.g-as')
            .data([data]);

        system.enter().append('g')
            .attr('class','g-as')
            .merge(system)
            .each(function(d){
                const dayId = d3.select(this.parentNode).attr('id');
                const i = dayId.charAt(dayId.length-1);
                const stacks = d3.select(this).selectAll('.area')
                    .data(stack(d.values[i].values));

                stacks.enter()
                    .append('path')
                    .attr('class','area')
                    .merge(stacks)
                    .attr('d',area)
                    .style('fill', e => colorArea(e.key));

                stacks.exit().remove();

                const lines = d3.select(this).selectAll('.quarter-line');
                if(lines.size() == 0){
                    lines.data([0.25,0.5,0.75])
                        .enter()
                        .append('line')
                        .attr('class','quarter-line')
                        .attr('x1',scaleTime(obj.timeMin))
                        .attr('x2',scaleTime(obj.timeMax))
                        .attr('y1',e => scaleUtil(e))
                        .attr('y2',e => scaleUtil(e));
                }
            });

        system.exit().remove();
            
        d3.selectAll('.g-as').classed('hidden',true);

    }else if(story == 'ws'){
        const colorArea = d3.scaleOrdinal()
            .domain(keys)
            .range(['#616161','#FFC107','#FAFAFA'])

        const ws = d3.selectAll('.g-day').selectAll('.g-ws')
            .data([data]);

        ws.enter().append('g')
            .attr('class','g-ws')
            .merge(ws)
            .each(function(d){
                const dayId = d3.select(this.parentNode).attr('id');
                const i = dayId.charAt(dayId.length-1);
                const stacks = d3.select(this).selectAll('.area')
                    .data(stack(d.values[i].values));

                stacks.enter()
                    .append('path')
                    .attr('class','area')
                    .merge(stacks)
                    .attr('d',area)
                    .style('fill', d => colorArea(d.key));

                stacks.exit().remove();

                const lines = d3.select(this).selectAll('.quarter-line');
                if(lines.size() == 0){
                    lines.data([0.25,0.5,0.75])
                        .enter()
                        .append('line')
                        .attr('class','quarter-line')
                        .attr('x1',scaleTime(obj.timeMin))
                        .attr('x2',scaleTime(obj.timeMax))
                        .attr('y1',e => scaleUtil(e))
                        .attr('y2',e => scaleUtil(e));
                }
            });

        ws.exit().remove();
            
        d3.selectAll('.g-ws').classed('hidden',true);
    }
}

function generateScatterplots(data){
// d3.select('#supp').selectAll('.g-day')
//     .append('g')
//     .attr('class','g-hot')
//     .each(function(d,i){
//         let i = 0;
//         while(i < 4){
//             d3.select(this).append('g')
//                 .attr('class','')
//         }
//         d3.select(this).selectAll('.vehicles')
//             .data(data.values[i].filter(e => e.))
//     })
}

function mainView(){
    d3.selectAll('.btn-story').classed('btn-active',false);
    d3.select('#btn-main').classed('btn-active',true);

    d3.select('#parking').selectAll('.line-unused').classed('hidden',true);
    d3.select('#parking').selectAll('.line-violated').classed('hidden',true);
    d3.select('#parking').selectAll('.expired').classed('expired',false);
    d3.select('#parking').selectAll('.non-business').classed('non-business',false);
    d3.select('#parking').selectAll('.line-vacant').classed('hidden',true);
    d3.select('#parking').selectAll('.line-util').style('stroke', null);

    d3.selectAll('.g-as').classed('hidden',true);
    d3.selectAll('.g-ws').classed('hidden',true);
    d3.selectAll('.g-business').classed('hidden',true);
}

function wastedSpace(){
    d3.selectAll('.btn-story').classed('btn-active',false);
    d3.select('#btn-ws').classed('btn-active',true);

    d3.select('#parking').selectAll('.expired').classed('expired',false);
    d3.select('#parking').selectAll('.non-business').classed('non-business',false);

    d3.select('#parking').selectAll('.line-unused').classed('hidden',false);
    d3.select('#parking').selectAll('.line-violated').classed('hidden',false);

    d3.select('#parking').selectAll('.line-util').style('stroke', '#FAFAFA');
    d3.select('#parking').selectAll('.line-vacant').classed('hidden',false);

    d3.selectAll('.g-as').classed('hidden',true);

    d3.selectAll('.g-ws').classed('hidden',false);

    d3.selectAll('.g-business').classed('hidden',true);
}

function abusedSystem(){
    d3.selectAll('.btn-story').classed('btn-active',false);
    d3.select('#btn-as').classed('btn-active',true);

    d3.select('#parking').selectAll('.line-unused').classed('hidden',true);
    d3.select('#parking').selectAll('.line-violated').classed('hidden',true);
    d3.select('#parking').selectAll('.line-util').style('stroke', null);
    d3.select('#parking').selectAll('.line-vacant').classed('hidden',true);
    d3.selectAll('.g-ws').classed('hidden',true);

    d3.select('#parking').selectAll('.g-day')
        .each(function(e){
            let i=0;
            while(i < 4){
                d3.select(this)
                    .select(`#g-slot${i}-util`)
                    .selectAll('.line-util')
                    .classed('expired', d => (d[`expired_s${i}`] == 1) ? true : false)
                    .classed('non-business', d => (d.business_hrs == 0 && d[`expired_s${i}`] == 1) ? true : false);
        
                i++;
            }
        })

    d3.selectAll('.g-as').classed('hidden',false);
    d3.selectAll('.g-business').classed('hidden',false);
}

function spotHotness(){
    d3.selectAll('.btn-story').classed('btn-active',false);
    d3.select('#btn-hot').classed('btn-active',true);

    d3.select('#parking').selectAll('.line-unused').classed('hidden',true);
    d3.select('#parking').selectAll('.line-violated').classed('hidden',true);

    d3.select('#parking').selectAll('.expired').classed('expired',false);
    d3.select('#parking').selectAll('.non-business').classed('non-business',false);
    d3.selectAll('.g-as').classed('hidden',true);

    d3.select('#parking').selectAll('.line-vacant').classed('hidden',false);
    d3.selectAll('.g-ws').classed('hidden',true);
    d3.selectAll('.g-business').classed('hidden',true);

    d3.select('#parking').selectAll('.g-day')
        .each(function(e){
            let i = 0;
            while(i < 4){
                d3.select(this)
                    .select(`#g-slot${i}-util`)
                    .selectAll('.line-util')
                    .style('stroke', d => (d[`in_s${i}`] == 1) ? '#009688' : scaleDur(d[`dur_s${i}`]))
                    .sort((a,b) => (a[`in_s${i}`] == 1) ? 1 : -1);
        
                i++;
            }
        })

}