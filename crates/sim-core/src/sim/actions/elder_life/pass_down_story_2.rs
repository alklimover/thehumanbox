use super::super::ctx::ActionCtx;

pub fn apply(ctx: &mut ActionCtx) -> f32 {
    let owned: Vec<String> = ctx
        .org()
        .discoveries
        .iter()
        .map(|name| name.to_string())
        .collect();
    if owned.is_empty() || ctx.kin.is_empty() {
        ctx.think("nobody to teach");
        return 0.02;
    }
    let pick = owned[ctx.tick as usize % owned.len()].clone();
    let kin = ctx.kin.clone();
    let mut passed = 0;
    for &k in &kin {
        let o = &mut ctx.sim.organisms[k];
        if !o.alive {
            continue;
        }
        if !o.discoveries.contains(pick.as_str()) {
            o.discoveries.insert(pick.clone());
            passed += 1;
            if passed >= 2 {
                break;
            }
        }
    }
    if passed > 0 {
        ctx.think("a story");
        ctx.event("life", "passed down a story");
        return 0.12;
    }
    ctx.think("a story");
    ctx.event("chore", "a story");
    0.03
}
