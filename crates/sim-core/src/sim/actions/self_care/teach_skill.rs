use super::super::ctx::ActionCtx;

pub fn apply(ctx: &mut ActionCtx) -> f32 {
    let pupil = ctx
        .kin
        .iter()
        .copied()
        .filter(|&k| ctx.sim.organisms[k].age < 800)
        .min_by_key(|&k| ctx.sim.organisms[k].age);
    let Some(ki) = pupil else {
        ctx.think("looking for a pupil");
        return 0.0;
    };
    let mine: Vec<String> = ctx.sim.organisms[ctx.idx]
        .discoveries
        .iter()
        .map(|name| name.to_string())
        .collect();
    let mut taught = false;
    for d in mine {
        if !ctx.sim.organisms[ki].discoveries.contains(d.as_str()) {
            ctx.sim.organisms[ki].discoveries.insert(d);
            taught = true;
            break;
        }
    }
    ctx.think("teaching a skill");
    if taught {
        0.012
    } else {
        0.0
    }
}
