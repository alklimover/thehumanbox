use super::super::ctx::ActionCtx;

pub fn apply(ctx: &mut ActionCtx) -> f32 {
    let owned: Vec<String> = ctx
        .org()
        .discoveries
        .iter()
        .map(|name| name.to_string())
        .collect();
    if owned.is_empty() || ctx.kin.is_empty() {
        ctx.think("nobody to tell");
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
        ctx.think("pass down a grudge");
        ctx.event("life", "passed down a grudge");
        return 0.12;
    }
    ctx.think("pass down a grudge");
    ctx.event("chore", "passed down a grudge");
    0.03
}
