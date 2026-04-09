pub mod bay;
pub mod beban;
pub mod beban_record;
pub mod classification;
pub mod unit;
pub mod unit_category;
pub mod unit_type;
pub mod user;

// Re-export legacy types for backward compatibility
pub use bay::{
    BayLegacy as Bay, CreateBayInputLegacy as CreateBayInput,
    UpdateBayInputLegacy as UpdateBayInput,
};
pub use beban_record::{
    BebanLegacy as Beban, CreateBebanInputLegacy as CreateBebanInput,
    UpdateBebanInputLegacy as UpdateBebanInput,
};
pub use unit::{
    CreateUnitInputLegacy as CreateUnitInput, UnitLegacy as Unit,
    UpdateUnitInputLegacy as UpdateUnitInput,
};
pub use unit_category::{CreateUnitCategoryInput, UnitCategory, UpdateUnitCategoryInput};
