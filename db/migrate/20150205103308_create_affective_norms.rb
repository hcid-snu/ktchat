class CreateAffectiveNorms < ActiveRecord::Migration
  def change
    create_table :affective_norms do |t|
      t.string :name
      t.float :valence
      t.float :arousal
      t.float :dominance

      t.timestamps
    end
  end
end
